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
	'#FF0055', // Neon Pink
	'#FF3366', // Rose
	'#FF7700', // Neon Orange
	'#FFD000', // Bright Amber
	'#FFE600', // Electric Yellow
	'#00FF66', // Neon Green
	'#00F5D4', // Bright Teal
	'#00BBF9', // Vivid Blue
	'#4361EE', // Royal Blue
	'#7209B7', // Electric Purple
	'#F72585', // Hot Magenta
	'#FFFFFF', // Bright White
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

		// 150 bright particles exploding outward from behind the centered square modal box
		const particles: Particle[] = []
		const count = 150

		for (let i = 0; i < count; i++) {
			// Random angle in full circle
			const angle = Math.random() * Math.PI * 2
			// Start radius just tucked behind the 360x360 box edges
			const distFromCenter = 80 + Math.random() * 80

			const startX = centerX + Math.cos(angle) * distFromCenter
			const startY = centerY + Math.sin(angle) * distFromCenter

			// Radial burst speed outward from center + upward boost
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
		const duration = 3800 // 3.8s animation

		const render = (now: number) => {
			const elapsed = now - startTime
			const progress = elapsed / duration

			if (progress >= 1) {
				ctx.clearRect(0, 0, canvas.width, canvas.height)
				onComplete?.()
				return
			}

			// Fade out smoothly during the last 35% of the animation
			const globalAlpha = progress < 0.65 ? 1 : Math.max(0, 1 - (progress - 0.65) / 0.35)

			ctx.clearRect(0, 0, canvas.width, canvas.height)
			ctx.save()
			ctx.scale(dpr, dpr)

			for (const p of particles) {
				p.x += p.vx
				p.y += p.vy
				p.vy += 0.28 // gravity
				p.vx *= 0.965 // drag
				p.vy *= 0.965
				p.rotation += p.rotSpeed
				p.wobble += p.oscillationSpeed
				p.x += Math.sin(p.wobble) * p.oscillationDistance

				ctx.save()
				ctx.translate(p.x, p.y)
				ctx.rotate((p.rotation * Math.PI) / 180)
				ctx.globalAlpha = globalAlpha
				ctx.fillStyle = p.color

				// 3D tumbling effect via cosine scaling on height
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
