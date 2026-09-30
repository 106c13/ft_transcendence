import { Outlet, useOutletContext } from 'react-router-dom'
import { GameSocketProvider } from '../context/GameSocketProvider'
import type { LayoutContextType } from './MainLayout'

export default function GameLayout() {
    const layoutContext = useOutletContext<LayoutContextType>()

    return (
        <GameSocketProvider userId={layoutContext?.currentUser?.id}>
            <Outlet context={layoutContext} />
        </GameSocketProvider>
    )
}
