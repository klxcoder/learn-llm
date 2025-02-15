// Train the model: Build a word-to-next-words mapping.
function trainModel(text) {
  const words = text.split(/\s+/);
  const model = {};
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    if (!model[word]) {
      model[word] = [];
    }
    model[word].push(nextWord);
  }
  return model;
}

// Generate text using the trained model.
function generateText(model, startWord, numWords = 50) {
  let currentWord = startWord;
  let result = currentWord;
  for (let i = 0; i < numWords - 1; i++) {
    const nextWords = model[currentWord];
    if (!nextWords || nextWords.length === 0) break;
    currentWord = nextWords[Math.floor(Math.random() * nextWords.length)];
    result += " " + currentWord;
  }
  return result;
}

// Example training text.
const trainingText = "This is a simple example text for our language model. It demonstrates how a basic Markov chain can generate text. Enjoy experimenting with this toy model!";
const model = trainModel(trainingText);

// Start generating from a chosen word.
const generatedParagraph = generateText(model, "This", 30);
console.log(generatedParagraph);
