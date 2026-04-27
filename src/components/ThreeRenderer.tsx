import { useEffect, useState, type ReactElement } from "react"
import type { Grid, Paths } from "./MazeHandler"
import { Canvas } from '@react-three/fiber'
import { OrthographicCamera, Vector3 } from 'three'
import { Line } from "@react-three/drei"

type RenderNode = {
  hasUp: boolean
  hasDown: boolean
  hasLeft: boolean
  hasRight: boolean
  hasForward: boolean
  hasBackward: boolean
  terminator: boolean,
    connections: { x: number, y: number, z: number }[]
  position: { x: number; y: number; z: number }
}

const standardColor = '#847d72'
const standardLineColor = '#d1b88e'

export function ThreeRenderer({ grid, paths, sizeX, endNodes }: { grid: Grid, paths: Paths, sizeX:number, endNodes: string[] }) {
    useEffect(() => {}, [grid, paths])

    const myCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
    myCamera.position.set(100, 135, 100) // Position the camera above the scene
    myCamera.lookAt(0, 0, 0)
    myCamera.zoom = 30
    myCamera.updateProjectionMatrix()

    const positions = Object.keys(grid).reduce((acc, key) => {
        //assume c12 is at the 0,0,0. base1 is on the xy plane and base2 is on the yz plane. Cap is on the xz plane.
        const node = grid[key]
        if (node.zone === "base1") {
            acc[key] = { x: -(sizeX-node.x)+1, y: -node.y, z: 0 }
        }
        else if (node.zone === "base2") {
            acc[key] = { x: 0, y: -node.y, z: -node.x }
        }
        else if (node.zone === "cap") {
            acc[key] = { x: -(sizeX-node.x)+1, y: 0, z: -(sizeX-node.y)+1 }
        }else if (node.zone === "c1") {
            acc[key] = { x: -(sizeX-node.x)+1, y: 0, z: 0 }
        }else if (node.zone === "c2") {
            acc[key] = { x: 0, y: 0, z: -node.x - 1}
        }else if (node.zone === "12") {
            //12 is in a vertical line down from c12
            acc[key] = { x: 0, y: -node.y, z: 0 }
        }
        else if (node.zone === "c12") {
            acc[key] = { x: 0, y: 0, z: 0 }
        }
        return acc
    }, {} as { [key: string]: { x: number, y: number, z: number } })

    const removedConnectionsGrid: Grid = Object.keys(grid).reduce((acc, key) => {
        const node = grid[key]
        acc[key] = { ...node, connections: [] }
        return acc
    }, {} as Grid)
    const pathedGrid = paths.reduce((acc, path) => {
        const [from, to] = path
        if (acc[from] && acc[to]) {
            if (!acc[from].connections.includes(to)) {
                acc[from].connections.push(to)
            }
            if (!acc[to].connections.includes(from)) {
                acc[to].connections.push(from)
            }
        }
        return acc
    }, { ...removedConnectionsGrid })

    const nodes: Record<string, RenderNode> = Object.keys(pathedGrid).reduce((acc, key) => {
        const node = pathedGrid[key]
        const position = positions[key]
        if (!position) return acc

        // remove undefined positions before reading x/y/z
        const conns = node.connections
            .map(conn => positions[conn])
            .filter((p): p is { x: number; y: number; z: number } => Boolean(p))
            .filter(conn => {
                const connDistance = Math.sqrt((conn.x - position.x) ** 2 + (conn.y - position.y) ** 2 + (conn.z - position.z) ** 2)
                return connDistance < 1.99 // Only include connections that are within a certain distance (to filter out any erroneous connections)
            })

        acc[key] = {
            hasUp: conns.some(conn => conn.y > position.y+0.1),
            hasDown: conns.some(conn => conn.y < position.y-0.1),
            hasLeft: conns.some(conn => conn.x < position.x-0.1),
            hasRight: conns.some(conn => conn.x > position.x+0.1),
            hasBackward: conns.some(conn => conn.z < position.z-0.1),
            hasForward: conns.some(conn => conn.z > position.z+0.1),
            terminator: conns.length === 1,
            connections: conns,
            position
        }

        return acc
    }, {} as Record<string, RenderNode>)

    return (
    <div id="canvas-container" style={{ height: '80vh' }}>
      <Canvas camera={myCamera}>
        <directionalLight position={[50, 100, 50]} lookAt={new Vector3(0,0,0)} intensity={1} />
        <Boxes nodes={nodes} endNodes={endNodes}/>
        {
            paths.map((path, index) => {
                const fromPos = positions[path[0]]
                const toPos = positions[path[1]]
                if (!fromPos || !toPos) return null
                const midPoint = { x: (fromPos.x + toPos.x) / 2, y: (fromPos.y + toPos.y) / 2, z: (fromPos.z + toPos.z) / 2 }
                //render a box
                return (
                    <mesh key={index} position={[midPoint.x, midPoint.y, midPoint.z]}>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshStandardMaterial color={standardColor} />
                    </mesh>
                )
            })
        }
      </Canvas>
    </div>
  )

}

export function Boxes({ nodes, endNodes }: { nodes: Record<string, RenderNode>, endNodes: string[] }) {
    return (
        <>
            {Object.keys(nodes).map(key => {
                const node = nodes[key]
                return (
                    <IndivBox key={key} node={node} isEndNode={endNodes.includes(key)} position={[node.position.x, node.position.y, node.position.z]} />
                )
            })}
        </>
    )
}

export function IndivBox({ key, node, isEndNode, position}: { key: string, node: RenderNode, isEndNode: boolean, position: [number, number, number] }) {
    const [hovered, setHovered] = useState(false)
    let lines: ReactElement[] = []
    if (node.hasUp) {
        //a "line" in this context is a thin box geometry that extends from the corner of the cube in the direction of the connection.
        lines = [...lines, ...pointingGeometry(key+"up", node.position, { x: 0, y: 1, z: 0 })]
    }

    if (node.hasDown) {
        lines = [...lines, ...pointingGeometry(key+"down", node.position, { x: 0, y: -1, z: 0 })]
    }

    if (node.hasLeft) {
        lines = [...lines, ...pointingGeometry(key+"left", node.position, { x: -1, y: 0, z: 0 })]
    }
    if (node.hasRight) {
        lines = [...lines, ...pointingGeometry(key+"right", node.position, { x: 1, y: 0, z: 0 })]
    }

    if (node.hasBackward) {
        lines = [...lines, ...pointingGeometry(key+"forward", node.position, { x: 0, y: 0, z: -1 })]
    }

    if (node.hasForward) {
        lines = [...lines, ...pointingGeometry(key+"backward", node.position, { x: 0, y: 0, z: 1 })]
    }
        
    lines = [...lines, ...faceEdgeGeometry(key+"backward", node.position, {hasUp: node.hasUp, hasRight: node.hasRight, hasDown: node.hasDown, hasLeft: node.hasLeft, hasForward: node.hasForward, hasBackward: node.hasBackward })]
    


    return (<group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            <mesh position={position}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color={isEndNode ? 'green' : hovered ? 'hotpink' : standardColor} />
            </mesh>


        {
            lines
        }
    </group>
    )
}


// eslint-disable-next-line react-refresh/only-export-components
export function pointingGeometry(key:string, position: { x: number, y: number, z: number }, direction: { x: number, y: number, z: number }): ReactElement[] {
    const lines:ReactElement[] = []
    const standardLineWidth = 2
    const cubeSize = 0.5
    //generate a set of 4 points for each corner of the face. The face's normal vector is "direction" and its size is assumed to be cubeSize

    const vert1 = { x: direction.y * cubeSize/2 - direction.z * cubeSize/2, y: direction.z * cubeSize/2 - direction.x * cubeSize/2, z: direction.x * cubeSize/2 - direction.y * cubeSize/2 }
    const vert2 = { x: direction.y * cubeSize/2 + direction.z * cubeSize/2, y: direction.z * cubeSize/2 + direction.x * cubeSize/2, z: direction.x * cubeSize/2 + direction.y * cubeSize/2 }
    const vert3 = { x: -direction.y * cubeSize/2 + direction.z * cubeSize/2, y: -direction.z * cubeSize/2 + direction.x * cubeSize/2, z: -direction.x * cubeSize/2 + direction.y * cubeSize/2 }
    const vert4 = { x: -direction.y * cubeSize/2 - direction.z * cubeSize/2, y: -direction.z * cubeSize/2 - direction.x * cubeSize/2, z: -direction.x * cubeSize/2 - direction.y * cubeSize/2 }

    const point1Modifier = cubeSize * 0.5
    const point2Modifier = cubeSize * 1

    lines.push(
        <Line key={`${key}-line1`} points={[[position.x + vert1.x + direction.x * point1Modifier, position.y + vert1.y + direction.y * point1Modifier, position.z + vert1.z + direction.z * point1Modifier], [position.x + vert1.x + direction.x * point2Modifier, position.y + vert1.y + direction.y * point2Modifier, position.z + vert1.z + direction.z * point2Modifier]]} color={standardLineColor} lineWidth={standardLineWidth} />
    )
    lines.push(
        <Line key={`${key}-line2`} points={[[position.x + vert2.x + direction.x * point1Modifier, position.y + vert2.y + direction.y * point1Modifier, position.z + vert2.z + direction.z * point1Modifier], [position.x + vert2.x + direction.x * point2Modifier, position.y + vert2.y + direction.y * point2Modifier, position.z + vert2.z + direction.z * point2Modifier]]} color={standardLineColor} lineWidth={standardLineWidth} />
    )
    lines.push(
        <Line key={`${key}-line3`} points={[[position.x + vert3.x + direction.x * point1Modifier, position.y + vert3.y + direction.y * point1Modifier, position.z + vert3.z + direction.z * point1Modifier], [position.x + vert3.x + direction.x * point2Modifier, position.y + vert3.y + direction.y * point2Modifier, position.z + vert3.z + direction.z * point2Modifier]]} color={standardLineColor} lineWidth={standardLineWidth} />
    )
    lines.push(
        <Line key={`${key}-line4`} points={[[position.x + vert4.x + direction.x * point1Modifier, position.y + vert4.y + direction.y * point1Modifier, position.z + vert4.z + direction.z * point1Modifier], [position.x + vert4.x + direction.x * point2Modifier, position.y + vert4.y + direction.y * point2Modifier, position.z + vert4.z + direction.z * point2Modifier]]} color={standardLineColor} lineWidth={standardLineWidth} />
    )
    return lines
}

// eslint-disable-next-line react-refresh/only-export-components
export function faceEdgeGeometry(key:string, position: { x: number, y: number, z: number }, hases:{hasUp: boolean, hasRight: boolean, hasDown: boolean, hasLeft: boolean, hasForward: boolean, hasBackward: boolean}): ReactElement[] {

    //draw 12 lines that outline the face of the cube in the direction of the connection. For example, if hasUp is true, draw a square above the cube that is connected to the top face of the cube. If hasRight is true, draw a square to the right of the cube that is connected to the right face of the cube, etc.

    const lines:ReactElement[] = []
    const standardLineWidth = 2
    const cubeSize = 0.5

    const lineSegments = [
        //top face to backward face
        { start: { x: -cubeSize/2, y: cubeSize/2, z: -cubeSize/2 }, end: { x: cubeSize/2, y: cubeSize/2, z: -cubeSize/2 }, hases: [hases.hasUp, hases.hasBackward] },
        //top face to forward face
        { start: { x: -cubeSize/2, y: cubeSize/2, z: cubeSize/2 }, end: { x: cubeSize/2, y: cubeSize/2, z: cubeSize/2 }, hases: [hases.hasUp, hases.hasForward] },
        //top face to left face
        { start: { x: -cubeSize/2, y: cubeSize/2, z: -cubeSize/2 }, end: { x: -cubeSize/2, y: cubeSize/2, z: cubeSize/2 }, hases: [hases.hasUp, hases.hasLeft] },
        //top face to right face
        { start: { x: cubeSize/2, y: cubeSize/2, z: -cubeSize/2 }, end: { x: cubeSize/2, y: cubeSize/2, z: cubeSize/2 }, hases: [hases.hasUp, hases.hasRight] },

        //bottom face to backward face
        { start: { x: -cubeSize/2, y: -cubeSize/2, z: -cubeSize/2 }, end: { x: cubeSize/2, y: -cubeSize/2, z: -cubeSize/2 }, hases: [hases.hasDown, hases.hasBackward] },
        //bottom face to forward face
        { start: { x: -cubeSize/2, y: -cubeSize/2, z: cubeSize/2 }, end: { x: cubeSize/2, y: -cubeSize/2, z: cubeSize/2 }, hases: [hases.hasDown, hases.hasForward] },
        //bottom face to left face
        { start: { x: -cubeSize/2, y: -cubeSize/2, z: -cubeSize/2 }, end: { x: -cubeSize/2, y: -cubeSize/2, z: cubeSize/2 }, hases: [hases.hasDown, hases.hasLeft] },
        //bottom face to right face
        { start: { x: cubeSize/2, y: -cubeSize/2, z: -cubeSize/2 }, end: { x: cubeSize/2, y: -cubeSize/2, z: cubeSize/2 }, hases: [hases.hasDown, hases.hasRight] },

        //left face to backward face
        { start: { x: -cubeSize/2, y: -cubeSize/2, z: -cubeSize/2 }, end: { x: -cubeSize/2, y: cubeSize/2, z: -cubeSize/2 }, hases: [hases.hasLeft, hases.hasBackward] },
        //left face to forward face
        { start: { x: -cubeSize/2, y: -cubeSize/2, z: cubeSize/2 }, end: { x: -cubeSize/2, y: cubeSize/2, z: cubeSize/2 }, hases: [hases.hasLeft, hases.hasForward] },

        //right face to backward face
        { start: { x: cubeSize/2, y: -cubeSize/2, z: -cubeSize/2 }, end: { x: cubeSize/2, y: cubeSize/2, z: -cubeSize/2 }, hases: [hases.hasRight, hases.hasBackward] },
        //right face to forward face
        { start: { x: cubeSize/2, y: -cubeSize/2, z: cubeSize/2 }, end: { x: cubeSize/2, y: cubeSize/2, z: cubeSize/2 }, hases: [hases.hasRight, hases.hasForward] },
    ]

    lineSegments.forEach((segment, index) => {
        //if either of the faces that this line segment connects has a connection, do not render this line segment as it will be covered by connection geometry.
        if (segment.hases.some(has => !!has)) {
            return
        }
        lines.push(
            <Line key={`${key}-face-edge-${index}`} points={[[position.x + segment.start.x, position.y + segment.start.y, position.z + segment.start.z], [position.x + segment.end.x, position.y + segment.end.y, position.z + segment.end.z]]} color={standardLineColor} lineWidth={standardLineWidth} />
        )
    })

    return lines
}