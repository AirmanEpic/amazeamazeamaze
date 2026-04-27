import type { Grid, Paths } from "./MazeHandler";

export function render(canvas: HTMLCanvasElement, grid: Grid, paths: Paths, mousePos: { x: number, y: number }) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const centerX = ctx.canvas.width / 2
    const centerY = ctx.canvas.height / 2
    const nodeSizeX = 20
    const nodeSizeY = 20
    const perspectiveShift = 3
    const countX = 4

    const positions = Object.values(grid).reduce((acc, node) => {
        if (node.zone === "base1") {
            // base1 is on the left. Shift DOWN the y coordinate by 10 for every x coordinate to create a diagonal layout
            acc[`${node.x},${node.y},1`] = {
                x: node.x * nodeSizeX + centerX - (nodeSizeX * countX), 
                y: (centerY + node.y * nodeSizeY) + (node.x * perspectiveShift) }
            return acc
        }
        const shiftDownInitial = 10 * (node.x - 1) // Calculate the initial downward shift based on the x coordinate

        if (node.zone === "base2") {
            // base2 is on the right. Shift UP the y coordinate by 10 for every x coordinate to create a diagonal layout
            acc[`${node.x},${node.y},2`] = { x: centerX + node.x * nodeSizeX, y: (centerY + node.y * nodeSizeY) - shiftDownInitial }
            return acc
        }

        //cap is a diamond at the top-center. The topmost tile is zero, the rightmost tile is [0, nodeSizeX-1], the bottommost tile is [nodeSizeY-1, nodeSizeX-1] and the leftmost tile is [0, nodeSizeY-1]
        if (node.zone === "cap") {
            const shiftUp = -200
            const coord = {
                x: node.x,
                y: node.y
            }

            const XShiftFactor = {//as X grows, shift the node by this much
                x:1,
                y:1
            }

            const YShiftFactor = {//as Y grows, shift the node by this much
                x:-1,
                y:1
            }

            acc[`${node.x},${node.y},c`] = {
                x: centerX + coord.x * XShiftFactor.x * nodeSizeX + coord.y * YShiftFactor.x * nodeSizeX,
                y: centerY + shiftUp + coord.x * XShiftFactor.y * nodeSizeY + coord.y * YShiftFactor.y * nodeSizeY
            }
            return acc
        }

        // c12 should be exactly in the middle of the canvas
        if (node.zone === "c12") {
            acc[`${node.x},${node.y},c12`] = { x: centerX, y: centerY }
            return acc
        }

        //c1 should be a 120 degree diagonal up-left from c12, and c2 should be a 120 degree diagonal up-right from c12. The distance between c1 and c12 and the distance between c2 and c12 should both be 10 nodes
        if (node.zone === "c1") {
            const angle = -120 * (Math.PI / 180) // Convert 120 degrees to radians and negate for up-left direction
            const distance = nodeSizeX * (countX - node.x)
            acc[`${node.x},${node.y},c1`] = {
                x: centerX + distance * Math.cos(angle),
                y: centerY + distance * Math.sin(angle)
            }
            return acc
        }

        if (node.zone === "c2") {
            const angle = -60 * (Math.PI / 180) // Convert 60 degrees to radians and negate for up-right direction
            const distance = nodeSizeX * (node.x + 2)
            acc[`${node.x},${node.y},c2`] = {
                x: centerX + distance * Math.cos(angle),
                y: centerY + distance * Math.sin(angle)
            }
            return acc
        }

        //12 should be vertical down
        if (node.zone === "12") {
            const distance = nodeSizeY // Distance of 10 nodes
            acc[`${node.x},${node.y},12`] = {
                x: centerX,
                y: centerY + distance * node.y
            }
            return  acc
        }
        
        return acc
    }, {} as { [key: string]: { x: number, y: number } })

    // Render connections and nodes
    Object.keys(positions).forEach(pos => {
        const node = grid[pos]
        const position = positions[pos]
        if (!position) return

        // Render connections
        node.connections.forEach(conn => {
            const connPos = positions[conn]
            if (connPos) {
                ctx.beginPath()
                ctx.moveTo(position.x, position.y)
                ctx.lineTo(connPos.x, connPos.y)
                ctx.strokeStyle = 'black'
                ctx.lineWidth = 2
                ctx.stroke()
            }
        })

        // Render node
        ctx.beginPath()
        ctx.arc(position.x, position.y, 2, 0, 2 * Math.PI)
        const colorMap = {
            "base1": 'blue',
            "base2": 'green',
            "cap": 'orange',
            "c1": 'purple',
            "c2": 'cyan',
            "c12": 'magenta',
            "12": 'yellow'
        }
        ctx.fillStyle = colorMap[node.zone] || 'gray'
        ctx.fill()
    })

    // get closest node to mouse position and highlight it
    let closestNodeKey: string | null = null
    let minDistance = Infinity
    
    Object.keys(positions).forEach(pos => {
        const position = positions[pos]
        if (!position) return
        const distance = Math.sqrt((position.x - mousePos.x) ** 2 + (position.y - mousePos.y) ** 2)
        if (distance < minDistance) {
            minDistance = distance
            closestNodeKey = pos
        }
    })

    // draw paths
    paths.forEach(path => {
        const pos1 = positions[path[0]]
        const pos2 = positions[path[1]]
        if (pos1 && pos2) {
            ctx.beginPath()
            ctx.moveTo(pos1.x, pos1.y)
            ctx.lineTo(pos2.x, pos2.y)
            ctx.strokeStyle = 'red'
            ctx.lineWidth = 4
            ctx.stroke()
        }
    })

    // If the closest node is within a certain distance, highlight it
    if (closestNodeKey && minDistance < 20) {
        const closestNode = positions[closestNodeKey]
        if (!closestNode) return
        ctx.beginPath()
        ctx.arc(closestNode.x, closestNode.y, 5, 0, 2 * Math.PI)
        ctx.fillStyle = 'red'
        ctx.fill()

        //display the
        const info = grid[closestNodeKey]
        if (info) {
            ctx.font = '12px Arial'
            ctx.fillStyle = 'red'
            ctx.fillText(`(${info.x}, ${info.y}, ${info.zone})`, closestNode.x + 10, closestNode.y - 10)
        }
    }
}