import type { Grid, Paths } from "../components/MazeHandler";

 export function FindPaths(grid: Grid, start: string): Paths {
    //prim's algorithm to find paths from start to end in the grid
    //each cell is a node, and connections are edges.
    //1) start with a grid full of walls (no connections)
    //2) add the starting cell to the maze
    //3) while there are still cells not in the maze:
    //  a) pick a random cell that is in the maze and has a neighbor that is not in the maze
    //  b) add the neighbor to the maze and connect it to the current cell
    //4) once all cells are in the maze, mark every connection between two cells as a path

    const maze: Grid = JSON.parse(JSON.stringify(grid)) // Deep copy the grid to create the maze
    const inMaze = new Set<string>() // Set to keep track of cells that are in the maze
    const paths: Paths = [] // Array to store the paths

    inMaze.add(start) // Add the starting cell to the maze
    let i=0; 
    while (inMaze.size < Object.keys(grid).length && i < 10000) {
        i++

        // Pick a random cell that is in the maze and has a neighbor that is not in the maze
        const inMazeArray = Array.from(inMaze)
        const current = inMazeArray[Math.floor(Math.random() * inMazeArray.length)]
        const currentNode = maze[current]
        if (!currentNode) continue

        // Get neighbors of the current cell
        const neighbors = currentNode.connections.filter(conn => !inMaze.has(conn))

        if (neighbors.length > 0) {
            // Pick a random neighbor that is not in the maze
            const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)]
            const neighborNode = maze[neighbor]
            if (!neighborNode) continue

            // Add the neighbor to the maze and connect it to the current cell
            inMaze.add(neighbor)
            currentNode.connections.push(neighbor)
            neighborNode.connections.push(current)

            // Mark the connection as a path
            paths.push([current, neighbor])
        }
    }
    return paths
}