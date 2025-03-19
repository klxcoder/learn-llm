# Simple Text Generator (No Libraries)
def simple_text_generator(seed_text, word_list, num_words=10):
    """
    Generates a simple text sequence based on a seed text and a word list.
    This function predicts the next word based on a simple probability
    calculation (counting occurrences).  It does NOT use any external
    libraries or advanced techniques like neural networks.

    Args:
        seed_text (str): The initial text to start the generation from.
        word_list (list): A list of words that the generator can use.
        num_words (int, optional): The number of words to generate. Defaults to 10.

    Returns:
        str: The generated text.  Returns an empty string if the seed_text
             is not found in the word_list.
    """
    generated_text = seed_text
    for _ in range(num_words):
        # 1. Find words that follow the last word of the current text.
        last_word = generated_text.split()[-1]
        following_words = []
        for i in range(len(word_list) - 1):
            if word_list[i] == last_word:
                following_words.append(word_list[i+1])

        # 2. If no following words are found, stop generating.
        if not following_words:
            break

        # 3. Calculate simple probabilities (count occurrences).
        word_counts = {}
        for word in following_words:
            word_counts[word] = word_counts.get(word, 0) + 1
        # 4. Select the most frequent following word
        next_word = max(word_counts, key=word_counts.get)
        generated_text += " " + next_word # add a space before the word

    return generated_text

# Example Usage of the simple_text_generator
word_list = ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
             "the", "lazy", "fox", "the", "quick", "brown", "dog", "sleeps",
             "the", "cat", "sits", "on", "the", "mat", "the", "dog", "barks"]
seed_text = "the quick brown fox"
generated_text = simple_text_generator(seed_text, word_list, num_words=8)
print(f"Generated text: {generated_text}") #f-string

seed_text = "the cat"
generated_text = simple_text_generator(seed_text, word_list, num_words=5)
print(f"Generated text: {generated_text}")

seed_text = "nonexistent" #seed text not in word_list
generated_text = simple_text_generator(seed_text, word_list, num_words=5)
print(f"Generated text: {generated_text}") #will return seed text only

