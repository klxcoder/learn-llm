with open('input.txt', 'r', encoding='utf-8') as f:
    text = f.read()

print("length of dataset in characters: ", len(text)) # 1115394

# let's look at the first 100 characters
print(text[:100])