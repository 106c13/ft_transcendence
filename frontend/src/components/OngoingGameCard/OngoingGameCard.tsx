import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Chess } from 'chess.js'
import io from 'socket.io-client'
import ChessBoard from '../ChessBoard/ChessBoard'
import { playSound } from '../../utils/sound'
import styles from './OngoingGameCard.module.css'

import type { LiveGamePlayer, LiveGameData } from '../../utils/gameUtils';
export type { LiveGamePlayer, LiveGameData };

type Props = {
	gameData: LiveGameData
	profileUsername: string
	currentUserId?: number | null
	size?: number | null
	onGameOverStartExit?: () => void
	onGameOverDone: () => void
}

export default function OngoingGameCard({
	gameData,
	profileUsername,
	currentUserId,
	size,
	onGameOverStartExit,
	onGameOverDone,
}: Props) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const [fen, setFen] = useState(gameData.fen)
	const [turn, setTurn] = useState<'w' | 'b'>(gameData.turn)
	const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(gameData.lastMove || null)
	const [isCheck, setIsCheck] = useState(!!gameData.isCheck)
	const [isPaused, setIsPaused] = useState(!!gameData.isPaused)
	const [blackPlayer, setBlackPlayer] = useState<LiveGamePlayer>(gameData.blackPlayer)

	const [gameOverResult, setGameOverResult] = useState<{
		winner: 'w' | 'b' | 'draw' | null
		reason?: string
		matchId?: number
	} | null>(null)
	const [countdown, setCountdown] = useState<number | null>(null)
	const [isResultExiting, setIsResultExiting] = useState(false)
	const [newMatchPhase, setNewMatchPhase] = useState<'idle' | 'enter' | 'exit'>('idle')
	const [isExiting, setIsExiting] = useState(false)

	const prevGameIdRef = useRef<string>(gameData.gameId)
	const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// If gameData changes to another game (e.g. rematch or next match)
	useEffect(() => {
		if (prevGameIdRef.current !== gameData.gameId) {
			prevGameIdRef.current = gameData.gameId
			if (exitTimeoutRef.current) {
				clearTimeout(exitTimeoutRef.current)
				exitTimeoutRef.current = null
			}
			setIsExiting(false)
			setFen(gameData.fen)
			setTurn(gameData.turn)
			setLastMove(gameData.lastMove || null)
			setIsCheck(!!gameData.isCheck)
			setIsPaused(!!gameData.isPaused)
			setBlackPlayer(gameData.blackPlayer)
			playSound('game-start')

			const triggerNewMatchBanner = () => {
				setNewMatchPhase('enter')
				const exitTimer = setTimeout(() => {
					setNewMatchPhase('exit')
				}, 2100)
				const doneTimer = setTimeout(() => {
					setNewMatchPhase('idle')
				}, 2500)
				return () => {
					clearTimeout(exitTimer)
					clearTimeout(doneTimer)
				}
			}

			// If a previous game result is currently showing, animate it out first before showing new match banner
			if (gameOverResult) {
				setIsResultExiting(true)
				const transitionTimer = setTimeout(() => {
					setGameOverResult(null)
					setCountdown(null)
					setIsResultExiting(false)
					triggerNewMatchBanner()
				}, 350)
				return () => clearTimeout(transitionTimer)
			} else {
				setGameOverResult(null)
				setCountdown(null)
				setIsResultExiting(false)
				return triggerNewMatchBanner()
			}
		}
	}, [gameData, gameOverResult])

	// Socket connection to /game for real-time moves and game_over events
	useEffect(() => {
		if (!gameData.gameId) return

		const socket = io('/game', {
			query: { userId: currentUserId ? currentUserId.toString() : '' },
			transports: ['websocket', 'polling'],
		})

		const joinRoom = () => {
			socket.emit('join_game', { gameId: gameData.gameId, preview: true })
		}

		socket.on('connect', joinRoom)
		if (socket.connected) {
			joinRoom()
		}

		socket.on('game_state', (data: any) => {
			if (data.fen) setFen(data.fen)
			if (data.turn) setTurn(data.turn)
			if (data.isPaused !== undefined) setIsPaused(data.isPaused)
			if (data.blackPlayer) setBlackPlayer(data.blackPlayer)
		})

		socket.on('move_made', (data: any) => {
			setFen(data.fen)
			setTurn(data.turn)
			if (data.lastMove) setLastMove(data.lastMove)
			setIsCheck(!!data.isCheck)

			if (data.san?.includes('#') || data.isCheck) {
				playSound('move-check')
			} else if (data.san?.includes('x')) {
				playSound('capture')
			} else {
				playSound('move-opponent')
			}
		})

		socket.on('opponent_disconnected', () => {
			setIsPaused(true)
		})

		socket.on('opponent_reconnected', () => {
			setIsPaused(false)
		})

		socket.on('game_over', (data: any) => {
			setGameOverResult({
				winner: data.winner,
				reason: data.reason,
				matchId: data.matchId,
			})
			playSound('game-end')
		})

		return () => {
			socket.disconnect()
		}
	}, [gameData.gameId, currentUserId])

	// 5-second countdown on game over with smooth exit transition
	useEffect(() => {
		if (!gameOverResult) return

		setCountdown(5)
		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(timer)
					setIsExiting(true)
					onGameOverStartExit?.()
					exitTimeoutRef.current = setTimeout(() => {
						onGameOverDone()
					}, 450)
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => {
			clearInterval(timer)
			if (exitTimeoutRef.current) {
				clearTimeout(exitTimeoutRef.current)
				exitTimeoutRef.current = null
			}
		}
	}, [gameOverResult, onGameOverDone, onGameOverStartExit])

	// Orientation: Profile user is hero at bottom
	const isProfileBlack = profileUsername.toLowerCase() === blackPlayer.username.toLowerCase()
	const bottomColor: 'w' | 'b' = isProfileBlack ? 'b' : 'w'

	const ranks = isProfileBlack ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1']
	const files = isProfileBlack ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

	const displayChess = useMemo(() => {
		try {
			return new Chess(fen)
		} catch {
			return new Chess()
		}
	}, [fen])

	// Winner badge text & styling
	const isDraw =
		gameOverResult !== null &&
		(gameOverResult.winner === null ||
			gameOverResult.winner === 'draw' ||
			gameOverResult.reason === 'DRAW' ||
			gameOverResult.reason === 'STALEMATE' ||
			gameOverResult.reason === 'INSUFFICIENT_MATERIAL' ||
			gameOverResult.reason === 'THREEFOLD_REPETITION')

	const isProfileWinner =
		!isDraw &&
		((gameOverResult?.winner === 'w' && !isProfileBlack) ||
			(gameOverResult?.winner === 'b' && isProfileBlack))

	const handleCardClick = () => {
		navigate(`/game/${gameData.gameId}`)
	}

	const cardStyle = {
		width: '100%',
		height: size ? `${size}px` : '100%',
		aspectRatio: '1 / 1',
	}

	return (
		<div
			className={`${styles.ongoingGameCard} ${isExiting ? styles.isExiting : ''}`}
			style={cardStyle}
			onClick={handleCardClick}
			role="button"
			tabIndex={0}
		>
			{/* Game Over Result Badge in Center */}
			{gameOverResult && (
				<div
					className={`${styles.resultBadge} ${
						isDraw
							? styles.drawBadge
							: isProfileWinner
							? styles.victoryBadge
							: styles.defeatBadge
					} ${isResultExiting ? styles.resultBadgeExit : ''}`}
				>
					<span>
						{isDraw
							? `½ - ½ ${t('draw')}`
							: isProfileWinner
							? `🏆 ${t('victory')}`
							: t('defeat')}
					</span>
					{countdown !== null && (
						<span className={styles.countdownPill}>
							⏱️ {countdown}s
						</span>
					)}
				</div>
			)}

			{/* New Match Flash Indicator Centered (only rendered when no game over result) */}
			{!gameOverResult && newMatchPhase !== 'idle' && (
				<div
					className={`${styles.newMatchBanner} ${
						newMatchPhase === 'exit' ? styles.newMatchBannerExit : ''
					}`}
				>
					<span>⚔️</span>
					<span>{t('new_match_started')}</span>
				</div>
			)}

			{/* Hover Overlay: Click to spectate with weaker blur and "see all" button style */}
			<div className={styles.hoverOverlay}>
				<div className={styles.spectateButton}>
					<span>{t('click_to_spectate')}</span>
					<span className={styles.spectateArrow}>→</span>
				</div>
			</div>

			{/* Chessboard */}
			<div className={styles.boardWrapper}>
				<ChessBoard
					displayChess={displayChess}
					displayFen={fen}
					ranks={ranks}
					files={files}
					selectedSquare={null}
					validMoves={[]}
					lastMove={lastMove}
					premoveSquares={new Set()}
					isReviewing={false}
					isCheck={isCheck}
					turn={turn}
					playerColor={bottomColor}
					showPromotion={false}
					promotionSquare={null}
					isPaused={isPaused}
					pauseCountdown={null}
					onSquareClick={() => {}}
					onSquareSelect={() => {}}
					onPieceDrop={() => {}}
					onPromotionSelect={() => {}}
					onPromotionCancel={() => {}}
					isGameOver={!!gameOverResult}
					isViewer={true}
				/>
			</div>
		</div>
	)
}
