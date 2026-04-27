import { useEffect, useRef, useState } from "react"
import type { Grid, Paths } from "./MazeHandler"
import { render } from "./standardRender"

export function NodeRenderer({ grid, paths }: { grid: Grid, paths: Paths }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null)
    
    useEffect(() => {
        const canvas = canvasRef.current
        const myMousePos = mousePos || { x: 0, y: 0 }
        if (canvas) {
            render(canvas, grid, paths, myMousePos)
        }
    }, [grid, paths, mousePos])
    
    return <canvas ref={canvasRef} width={1000} height={1000} onMouseMove={(e)=>{
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y })
    }} />

}