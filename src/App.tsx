import './App.css'
import { GameHandler } from './components/MazeHandler'
import '@fontsource-variable/quicksand/wght.css';
import '@fontsource-variable/space-grotesk/wght.css';

function App() {
	return (
		<div className="App">
			<h1 style={{ fontFamily: 'Quicksand Variable, sans-serif', marginTop:"20px" }}>Amaze Amaze Amaze</h1>
			<GameHandler />

		</div>
	)
}

export default App
