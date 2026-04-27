import { useEffect, useState } from "react"
import { GenerateMazeGrid } from "../generator/generateMazeGrid"
import { FindPaths } from "../generator/findPaths"
import { ThreeRenderer } from "./ThreeRenderer"
import '../App.css'
import '@fontsource-variable/quicksand/wght.css';
import '@fontsource-variable/space-grotesk/wght.css';
import { NodeRenderer } from "./NodeRenderer"

export type Paths = string[][] // This will hold the paths to be rendered
export type Grid = {
    [XYZ: string]: {
        x: number,
        y: number,
        connections: string[]
        zone: "base1" | "base2" | "cap" | "c1" | "c2" | "c12" | "12"
    }
} // This will hold the maze grid

export function GameHandler(){
    // This component will handle the game logic and rendering
    const [grid, setGrid] = useState<Grid>({}) // This will hold the maze grid
    const [paths, setPaths] = useState<Paths>([]) // This will hold the paths to be rendered

    useEffect(() => {
        // Initialize the maze grid and paths here
        (async () => {
            const newGrid = GenerateMazeGrid(5, 12) // Function to generate the maze grid
            setGrid(newGrid)

            const newPaths = FindPaths(newGrid, "0,0,c1") // Function to find paths in the maze
            setPaths(newPaths)
        })()
    }, [])

    
    // Render the maze using standard 2D canvas rendering
    return (
        <div>
            <ThreeRenderer grid={grid} paths={paths} sizeX={5} endNodes={["0,0,c1", "4,9,2"]}/>
            {/* <NodeRenderer grid={grid} paths={paths}/> */}
            			<div style={{
				maxWidth:"800px",
			}}>
				<h2 style={{ fontFamily: 'Quicksand Variable, sans-serif' }}>What's this?</h2>
					<p style={{ fontFamily: 'Space Grotesk Variable, sans-serif' }}>{
`
Inspired by a reddit post, and my ancient habit of making mazes on graph paper instead of paying attention in math lecture, this peice of generative art is a 3d pillar maze generator.
I'm really excited to show how it was done. The post below is both an example of how its done, and a longer look at the way I solve problems like this.
`}</p>
<h2 style={{ fontFamily: 'Quicksand Variable, sans-serif' }}>How is this done?</h2>
<p>
	{`
Let me start by explaining the magic trick right off the bat. Instead of treating the pillar as a whole, each plane of the pillar is its own "Beast" handled in similar but slightly different ways.
	`}
</p>
<p>
	{`
There are three main "Sections". The "Cap" and the two sides we see, I call them base1 and base2, on the left and right respectively. 
	`}
</p>
<p>
	{`
However, if each "Section" was treated independently, the lack of continuity would be obvious and make the result less impressive. So, each section is connected to the neighbors with a special "section". Finally, the corner sections are joined to one another with a corner-corner section which is just one block.
each section has an address which I'll be referring to in this post: Base1 is "1", base2 is "2", cap is "c", the corner between 1 and 2 is 12, the corner between 1 and c is c1, the corner between 2 and c is c2, and the corner between all three is c12.
	`}
</p>
<img src="/nodeColors.png" alt="Node Colors: a series of colored spheres in the same shape as the maze" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p style={{fontSize:'12px'}}>
    Above: 1 in blue, 2 in green, c in orange, c1 in purple, c2 in cyan, 12 in yellow, and c12 in magenta. The colors are arbitrary and only for visualization purposes.
</p>
<p>
	{`
The key to this understanding is that graph paper is a subset of a "graph", in the sense of a set of interconnected nodes. Each square on the graph paper is a node, and the lines between them represent the connections. 
	`}
</p>
<p>
	{`
It's worth saying, though, that a graph doesn't always need to be in a grid format. In fact, the connections between nodes can and usually are completely arbitrary (Graph paper is a special case). 
This fact of it being arbitrary is what Amaze relies on. The grid format is convenient and used for parts, but due to the way the corners and cap works, it's better to pretend that the whole thing isn't as grid than it is to think of all the special cases.
	`}
</p>
<p>
	{`
With that said, to make something like this, it's often beneficial to break something down into smaller chunks. For me, the first chunk I decided on was representing the thing as a true graph, with interconnected nodes, in order to ensure all the connections and the maze generation part worked before
moving to the visually impressive but more fiddly 3D part. 
	`}
</p>
<h2 style={{ fontFamily: 'Quicksand Variable, sans-serif' }}> The graph</h2>
<p>
	{`
To start, I had to make a "simple" visual representation of the panels and corners, to verify they all connected together properly. This was relatively simple with a few hiccups about node ordering that I should have seen coming;
but honestly, any visual representation is OK as long as the lines between the nodes are correct; everthing else is window dressing. 
	`}
</p>
<img src="/slantedLady.png" alt="Cloaked Lady: a 2D representation of the maze with nodes colored by section" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p style={{fontSize:'12px'}}>
    I call this the "Cloaked lady" view because it trivially represents a hooded cloak. The colors are the same as the previous image. As you can see, not a lot of effort was spent making this model look correct. Every section is manually placed.
</p>
<p>
    The code for the graph generation is in "generator/generateMazeGrid.ts"
</p>
<p>
	{`
Each node has a relatively arbitrary "address" which is a string. In general, the string is (x,y,section) where x and y are the coordinates of the node in its own section. The section is one of the 7 sections above.
	`}
</p>
<p>
	{`
while this is generally the format, the code doesn't actually rely on that being true. Instead it's just a convenient way to generate unique addresses for each node. These addresses will be used in all subsequent code. The interactive cloaked lady diagram shows these addresses on hover.
	`}
</p>
<p>
	{`
This arranges everything into "nodes" which have "connections" in my parlance.
Once that's done, the next step was to make the maze generation. I used a simple implementation of Prim's algorithm, which is a common algorithm for maze generation.
Other explanations use "walls" to describe things but I don't think that's a good way to think about it. I think of it more as starting with a cell. Then, you take a random connection (from the above parlance)
and add it to the new maze. Then, you take a random connection from ALL AVAILABLE NODES IN THE GRAPH. 
	`}
</p><p>
	{`Imagine if your first step is to go from x=1 to x=2. The next step could be going up from 1, up from 2, right from 2, down from 2, or down from 1.
This is repeated until all nodes are in the maze. This algorithm is relatively simple, and produces good mazes. You can find it in "generator/findPaths.ts"
The result of this is a list of "paths" which are 2-cell line segments that represent the connections between nodes in the maze. `}
</p><p>
	{`
It is drawn below in red on top of the "cloaked lady" diagram.
This is hoverable and is a live view of the maze at the top of the page if you wanted to compare.
	`}
</p>
<NodeRenderer grid={grid} paths={paths}/>
<h2 style={{ fontFamily: 'Quicksand Variable, sans-serif' }}>To the 3D view</h2>
<p>
	{`
The cool part is done. The rest was making it look nice which turned out to be much harder and take the vast majority of the time, driving me to the very edge of sanity.
	`}
</p>
<p>
	{`
The first step was using threejs to represent the graph in 3D. Threejs has a nice react wrapper called react-three-fiber which makes it much easier to use in a react app. The goal was to represent the pillar in the same shape it would be in the final model. 
This took a fair bit of fiddling. I already showed you what the thing looked like above with the colored nodes, so might as well throw in a blooper now:
	`}
</p>
<img src="/3DBlooper.png" alt="3D Blooper: a 3D representation of the maze with nodes colored by section, but in weird positions" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p>
	{`
In this stage it was mostly guess-and-check. The colored nodes made it easy to tell where the problems were, so I just had to change coordinates until things looked right.
	`}
</p>
<p>
	{`
After this, my first instinct was to change the spheres to boxes and draw more boxes for the connections. The result is below:
	`}
</p>
<img src="/3DcoloredBoxes.png" alt="3D Colored Boxes: a 3D representation of the maze with nodes as boxes and connections as equal-sized boxes, colored by section" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p>
	{`
As you can see this isn't exactly art. The main problem is that each layer blends into the layer behind it, making it hard to see the structure. I had to add some lines for edges. Unfortunately, while that sounds easy, it was anything but.
	`}
</p>
<h2 style={{ fontFamily: 'Quicksand Variable, sans-serif' }}>Adding lines</h2>
<p>
	{`
right off the bat I knew I'd have to "Cheat", because my first instinct was to make a square path, and then add depth with extrusion, but this would be very weird on the corners, so I decided I would "Cheat" by adding edges to the interpenetrating cubes to make it look like it was 1 smooth geometry.
	`}
</p>
<p>
	{`
To do this, I further broke down every cube into its 6 faces. Each face could either be connected or not connected to other cubes. This was possible with the path system and the address system I built into it. 
	`}
</p>
<p>
	{`
Then, for each face, if it had a connection, there was a line drawn from the corner of the cube in the direction of the connection. This would have been a lot of work, but I built a generalized function with chatgpt that made it a lot faster.
	`}
</p>
<p>
	{`
However, the faces without a connection still looked odd. My first instinct was to simply highlight every face with a loop, with the loop slightly smaller than the cube so that the "connection" cubes hid it. Unfortunately making it smaller made it not align with the connection edges so that was abandoned (sorry, I forgot to take a screenshot!)
	`}
</p>
<p>
	{`
instead, I switched to using the same system I do now. The system works as follows: The cube is broken into 6 faces. Each face connects with another face in 4 areas. This connection is a line. If either of the two faces has a connection, hide the line. In all other cases, draw the line. This is shown in ThreeRenderer.tsx's "faceEdgeGeometry" function and booooooy was it a pain to make.
	`}
</p>
<img src="/connectionsblooper.png" alt="Connections Blooper: a 3D representation of the maze with nodes as boxes and connections as thin boxes, but with many visual bugs" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p>
    {`
Unfortunately you can see a lot of "connections" that point to absolutely nothing. It turned out that my algorithm was flipping a few sections on their axes, which made the connections not match at all visually.
`}
</p>
<img src='/blocksblooper.png' alt="Blocks Blooper: a 3D representation of the maze with nodes as boxes and connections as thin boxes, but with many visual bugs, including blocks not connecting to the right neighbors" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p>
    {`
After fixing the flipped sections, I could see there were still a lot of blocks that drew lines where none should have existed. This was because one of the findEdgeGeometry function's block codes was still not correct. I had to figure out which edge exactly was responsible. But eventually I did. 
`}
</p>
<img src='/anotherflipped.png' alt="Some blocks still don't connect" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p>
    {`
even with things mostly working, I still had a lot of blocks not connecting to their neighbors. This is an illegal maze; every block should lead to another IMHO. Turns out that the entire base1 section was flipped lol.
`}
</p>
<img src='/final.png' alt="Final: the final 3D representation of the maze with nodes as boxes with all visual bugs fixed" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p>
    {`
Finally. It was 11PM and I was starting to hallucinate, but it finally looked good. The only thing left was to change the color to something less painful, and then you have the result above.
`}
</p>
<p>
    {`
The algorithm can be cranked up to 20x40 but made my computer crash. Here's a representation of a 10x30 maze which we still struggle to fit on the screen:
`}
</p>
<img src="/massive.png" alt="Massive: a 3D representation of a much larger maze, with many more nodes and connections, but still with the same structure as the smaller maze" style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }} />
<p>
    {`
The algorithm's slowest part is the connecting edge generation. In the future, if I wanted to improve this, I would simplify the lines by gathering all straight lines into a single line segment. This would speed up the rendering at least.
A true optimization would involve changing the geometry to truly generated instead of using cubes. This would improve realtime performance but as you can see that's not needed.
We could also optimize by writing all of the visuals in shader language, but that would be a nightmare to develop and debug, and I don't think it's worth it for this project.
`}
</p>
<p style={{marginBottom:"100px"}}>
    {`
Overall, this was a really fun project to work on. It was a great way to learn about maze generation algorithms, and also a great way to learn about threejs and 3D rendering in general. I hope you enjoyed it as much as I did!
`}
</p>
        </div>
    </div>
    )
}