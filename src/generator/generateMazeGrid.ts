import type { Grid } from "../components/MazeHandler";

export function GenerateMazeGrid(x: number, y: number): Grid {
    //x = rectangle width
    //y = rectangle height
    //cap = x^2
    const base1 = []
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            base1.push({ x: i, y: j, connections: [], zone: "base1" as const })
        }
    }
    const base2 = []
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            base2.push({ x: i, y: j, connections: [], zone: "base2" as const })
        }
    }

    const cap = []
    for (let i = 0; i < x ; i++) {
        for (let j = 0; j < x; j++) {
            cap.push({ x: i, y: j, connections: [], zone: "cap" as const })
        }
    }

    //create full grid unconnected
    const grid: Grid = {}
    base1.forEach(node => {
        grid[`${node.x},${node.y},1`] = node
    })
    base2.forEach(node => {
        grid[`${node.x},${node.y},2`] = node
    })
    cap.forEach(node => {
        grid[`${node.x},${node.y},c`] = node
    })

    //connect the bases and cap in an agnostic way
    const toBeConnected = ["0,0,1", "0,0,2", "0,0,c"] // Start with the first nodes of each zone
    while (toBeConnected.length > 0) {
        const current = toBeConnected.pop()!
        const currentNode = grid[current]
        if (!currentNode) continue

        // Get neighbors (up, down, left, right) in the same zone
        const neighbors = [
            `${currentNode.x - 1},${currentNode.y},${currentNode.zone === "base1" ? "1" : currentNode.zone === "base2" ? "2" : "c"}`,
            `${currentNode.x + 1},${currentNode.y},${currentNode.zone === "base1" ? "1" : currentNode.zone === "base2" ? "2" : "c"}`,
            `${currentNode.x},${currentNode.y - 1},${currentNode.zone === "base1" ? "1" : currentNode.zone === "base2" ? "2" : "c"}`,
            `${currentNode.x},${currentNode.y + 1},${currentNode.zone === "base1" ? "1" : currentNode.zone === "base2" ? "2" : "c"}`
        ]

        neighbors.forEach(neighbor => {
            const neighborNode = grid[neighbor]
            if (neighborNode && !currentNode.connections.includes(neighbor)) {
                // Connect the current node to the neighbor
                currentNode.connections.push(neighbor)
                neighborNode.connections.push(current)

                // Add the neighbor to the list of nodes to be connected
                toBeConnected.push(neighbor)
            }
        })
    }

        //delete the top row of base1 and base2
    for (let i = 0; i < x; i++) {
        delete grid[`${i},0,1`]
        delete grid[`${i},0,2`]
    }

    //delete the bottom row and rightmost column of the cap
    for (let i = 0; i < x; i++) {
        delete grid[`${i},${x-1},c`]
        delete grid[`${x-1},${i},c`]
    }

    //delete the rightmoset column of base1 and the leftmost column of base2
    for (let j = 0; j < y; j++) {
        delete grid[`${x-1},${j},1`]
        delete grid[`0,${j},2`]
    }

    //clean up connections that point to deleted nodes
    Object.values(grid).forEach(node => {
        node.connections = node.connections.filter(connection => !!grid[connection])
    })

    //create a new line of nodes called 12 that connects the rightmost column of base1 and the leftmost column of base2
    for (let j = 1; j < y; j++) {
        const newNode: { x: number, y: number, connections: string[], zone: "12" } = { x: x-1, y: j, connections: [], zone: "12" as const }
        grid[`${x-1},${j},12`] = newNode

        //connect the new node to the rightmost column of base1 and the leftmost column of base2
        const base1Node = grid[`${x-2},${j},1`]
        const base2Node = grid[`1,${j},2`]
        if (base1Node) {
            newNode.connections.push(`${x-1},${j},1`)
            base1Node.connections.push(`${x-1},${j},12`)
        }
        if (base2Node) {
            newNode.connections.push(`0,${j},2`)
            base2Node.connections.push(`${x-1},${j},12`)
        }
    }

    //connect 12 nodes to each other
    for (let j = 1; j < y-1; j++) {
        const currentNode = grid[`${x-1},${j},12`]
        const nextNode = grid[`${x-1},${j+1},12`]
        if (currentNode && nextNode) {
            currentNode.connections.push(`${x-1},${j+1},12`)
            nextNode.connections.push(`${x-1},${j},12`)
        }
    }

    //create c1 nodes that connect the bottom row of the cap to the top row of base1
    for (let i = 0; i < x-1; i++) {
        const newNode: { x: number, y: number, connections: string[], zone: "c1" } = { x: i, y: 0, connections: [], zone: "c1" as const }
        grid[`${i},0,c1`] = newNode

        //connect the new node to the bottom row of the cap and the top row of base1
        const capNode = grid[`${i},${x-2},c`]
        const base1Node = grid[`${i},1,1`]
        if (capNode) {
            newNode.connections.push(`${i},${x-2},c`)
            capNode.connections.push(`${i},0,c1`)
        }
        if (base1Node) {
            newNode.connections.push(`${i},1,1`)
            base1Node.connections.push(`${i},1,c1`)
        }
    }

    //connect c1 nodes to each other
    for (let i = 0; i < x-2; i++) {
        const currentNode = grid[`${i},0,c1`]
        const nextNode = grid[`${i+1},0,c1`]
        if (currentNode && nextNode) {
            currentNode.connections.push(`${i+1},0,c1`)
            nextNode.connections.push(`${i},0,c1`)
        }
    }

    //create c2 nodes that connect the rightmost column of the cap to the top row of base2
    for (let i = 0; i < x-1; i++) {
        const newNode: { x: number, y: number, connections: string[], zone: "c2" } = { x: i, y: 0, connections: [], zone: "c2" as const }
        grid[`${i},0,c2`] = newNode

        //connect the new node to the rightmost column of the cap and the top row of base2
        //node (0,0,c2) should connect to (x-1, x-1, c) and (1,1,2)
        //that means node (i,0,c2) should connect to ((x-1),i,c) and (i+1,1,2)
        const capNode = grid[`${x-2},${(x-2)-i},c`]
        const base2Node = grid[`${i+1},1,2`]
        if (capNode) {
            newNode.connections.push(`${x-2},${(x-2)-i},c`)
            capNode.connections.push(`${i},0,c2`)
        }
        if (base2Node) {
            newNode.connections.push(`${i+1},1,2`)
            base2Node.connections.push(`${i},0,c2`)
        }
    }

    //connect c2 nodes to each other
    for (let i = 0; i < x-2; i++) {
        const currentNode = grid[`${i},0,c2`]
        const nextNode = grid[`${i+1},0,c2`]
        if (currentNode && nextNode) {
            currentNode.connections.push(`${i+1},0,c2`)
            nextNode.connections.push(`${i},0,c2`)
        }
    }

    //create a c12 node that connects the top 12 node, the rightmost c1 node, and the leftmost c2 node

    const c12Node: { x: number, y: number, connections: string[], zone: "c12" } = { x: 0, y: 0, connections: [], zone: "c12" as const }
    grid[`0,0,c12`] = c12Node
    //(x-1, 0, c1)
    //(0, 0, c2)
    //(0, 1, 12)
    const c1Node = grid[`${x-2},0,c1`]
    const c2Node = grid[`0,0,c2`]
    const c12TopNode = grid[`${x-1},1,12`]
    if (c1Node) {
        c12Node.connections.push(`${x-2},0,c1`)
        c1Node.connections.push(`0,0,c12`)
    }
    if (c2Node) {
        c12Node.connections.push(`0,0,c2`)
        c2Node.connections.push(`0,0,c12`)
    }
    if (c12TopNode) {
        c12Node.connections.push(`${x-1},1,12`)
        c12TopNode.connections.push(`0,0,c12`)
    }



    return grid

}

export function xyzToGridCell(xyz: string): { x: number, y: number, zone: "base1" | "base2" | "cap" } | null {
    const [x, y, zone] = xyz.split(",")
    if (zone === "1") {
        return { x: parseInt(x), y: parseInt(y), zone: "base1" }
    } else if (zone === "2") {
        return { x: parseInt(x), y: parseInt(y), zone: "base2" }
    } else if (zone === "c") {
        return { x: parseInt(x), y: parseInt(y), zone: "cap" }
    } else {
        return null
    }
}

export function gridCellToXyz(cell: { x: number, y: number, zone: "base1" | "base2" | "cap" }): string {
    const zone = cell.zone === "base1" ? "1" : cell.zone === "base2" ? "2" : "c"
    return `${cell.x},${cell.y},${zone}`
}