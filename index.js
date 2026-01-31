import express from 'express';
const app = express();

app.get('/', (req, res) => {
	res.send('Hello! Welcome to the Sportz server.');
});

const PORT = 8000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
// ...existing code...
