import { useEffect, useRef } from 'react'
import styles from './ModalConfetti.module.css'

interface Particle {
	x: number
	y: number
	vx: number
	vy: number
	sizeW: number
	sizeH: number
	color: string
	rotation: number
	rotSpeed: number
	oscillationSpeed: number
	oscillationDistance: number
	wobble: number
	shape: 'rect' | 'circle' | 'ribbon'
}

type Props = {
	onComplete?: () => void
}

const BRIGHT_COLORS = [
	'#FF0055',
	'#FF3366',
	'#FF7700',
	'#FFD000',
	'#FFE600',
	'#00FF66',
	'#00F5D4',
	'#00BBF9',
	'#4361EE',
	'#7209B7',
	'#F72585',
	'#FFFFFF',
]

export default function ModalConfetti({ onComplete }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const width = window.innerWidth
		const height = window.innerHeight
		const dpr = Math.min(window.devicePixelRatio || 1, 2)

		canvas.width = width * dpr
		canvas.height = height * dpr

		const centerX = width / 2
		const centerY = height / 2

		const particles: Particle[] = []
		const count = 150

		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2
			const distFromCenter = 80 + Math.random() * 80

			const startX = centerX + Math.cos(angle) * distFromCenter
			const startY = centerY + Math.sin(angle) * distFromCenter

			const speed = 10 + Math.random() * 16
			const radialVx = Math.cos(angle) * speed
			const radialVy = Math.sin(angle) * speed - (3 + Math.random() * 6)

			particles.push({
				x: startX,
				y: startY,
				vx: radialVx,
				vy: radialVy,
				sizeW: 6 + Math.random() * 7,
				sizeH: 8 + Math.random() * 10,
				color: BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)],
				rotation: Math.random() * 360,
				rotSpeed: (Math.random() - 0.5) * 14,
				oscillationSpeed: 0.06 + Math.random() * 0.08,
				oscillationDistance: 0.6 + Math.random() * 2.4,
				wobble: Math.random() * Math.PI * 2,
				shape: Math.random() > 0.35 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'ribbon',
			})
		}

		let animId: number
		const startTime = performance.now()
		const duration = 3800

		const render = (now: number) => {
			const elapsed = now - startTime
			const progress = elapsed / duration

			if (progress >= 1) {
				ctx.clearRect(0, 0, canvas.width, canvas.height)
				onComplete?.()
				return
			}

			const globalAlpha = progress < 0.65 ? 1 : Math.max(0, 1 - (progress - 0.65) / 0.35)

			ctx.clearRect(0, 0, canvas.width, canvas.height)
			ctx.save()
			ctx.scale(dpr, dpr)

			for (const p of particles) {
				p.x += p.vx
				p.y += p.vy
				p.vy += 0.28
				p.vx *= 0.965
				p.vy *= 0.965
				p.rotation += p.rotSpeed
				p.wobble += p.oscillationSpeed
				p.x += Math.sin(p.wobble) * p.oscillationDistance

				ctx.save()
				ctx.translate(p.x, p.y)
				ctx.rotate((p.rotation * Math.PI) / 180)
				ctx.globalAlpha = globalAlpha
				ctx.fillStyle = p.color

				const flipScale = Math.cos(p.wobble)

				if (p.shape === 'circle') {
					ctx.beginPath()
					ctx.arc(0, 0, p.sizeW * 0.5, 0, Math.PI * 2)
					ctx.fill()
				} else if (p.shape === 'ribbon') {
					ctx.fillRect(-p.sizeW / 2, (-p.sizeH / 2) * flipScale, p.sizeW * 0.6, p.sizeH * flipScale * 1.6)
				} else {
					ctx.fillRect(-p.sizeW / 2, (-p.sizeH / 2) * flipScale, p.sizeW, p.sizeH * flipScale)
				}

				ctx.restore()
			}

			ctx.restore()
			animId = requestAnimationFrame(render)
		}

		animId = requestAnimationFrame(render)

		return () => {
			cancelAnimationFrame(animId)
		}
	}, [onComplete])

	return <canvas ref={canvasRef} className={styles.confettiCanvas} />
}
