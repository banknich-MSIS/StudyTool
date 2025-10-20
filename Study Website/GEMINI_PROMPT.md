# Gemini CSV Generation Prompt

Copy and paste this prompt when uploading your study materials to Gemini:

---

Please convert this document into a study quiz CSV file with the following format:

First, add metadata rows:

- #themes: [list main topics covered]
- #suggested_types: mcq|short|truefalse
- #recommended_count: [number of questions to include in exam]

Then add questions in CSV format:
question,answer,type,options,concepts

For each question:

- question: The question text
- answer: The correct answer
- type: mcq (multiple choice), short (short answer), or truefalse
- options: For MCQ, list options separated by | (pipe)
- concepts: Topic/theme tags, comma-separated

Generate 20-30 comprehensive questions covering all key concepts.

---

## Example Output

```csv
#themes: Biology, Cell Structure, Organelles
#suggested_types: mcq, short, truefalse
#recommended_count: 15
question,answer,type,options,concepts
What is mitochondria?,Powerhouse of cell,short,,Cell Organelles
Which organelle contains DNA?,Nucleus,mcq,Nucleus|Mitochondria|Ribosome|Golgi,Cell Organelles
True or False: Chloroplasts are found in animal cells,False,truefalse,,Cell Organelles
What is the function of ribosomes?,Protein synthesis,short,,Cell Organelles
```

## Tips for Better Results

1. **Be specific about difficulty**: Ask for "beginner", "intermediate", or "advanced" level questions
2. **Specify question types**: Tell Gemini which types you prefer (multiple choice, short answer, true/false)
3. **Request specific topics**: Mention particular chapters or concepts you want emphasized
4. **Ask for explanations**: Request that answers include brief explanations when helpful

## Alternative Prompt (More Detailed)

```
Please analyze this study material and create a comprehensive quiz CSV file.

Format requirements:
1. Start with metadata lines:
   #themes: [comma-separated list of main topics]
   #suggested_types: [pipe-separated types: mcq|short|truefalse|cloze]
   #difficulty: [easy|medium|hard]
   #recommended_count: [number]

2. Then add questions in CSV format:
   question,answer,type,options,concepts

Guidelines:
- Create 20-30 questions covering all major concepts
- Mix question types appropriately
- For multiple choice, provide 4 options separated by |
- Include relevant concept tags for each question
- Ensure questions test understanding, not just memorization
- Make questions progressively more challenging

Focus on: [specify your focus areas here]
Difficulty level: [specify desired difficulty]
```

---

This prompt will help Gemini create well-structured CSV files that work perfectly with the Study Tool!
