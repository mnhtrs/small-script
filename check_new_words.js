let words_input = String(prompt("Input your new words:"))
const quiz_system = () => {   
   const new_words = arrays => {
      if(!Array.isArray(arrays)) return;
      const questions = []
      const answers = []
      for(let word of arrays){
         // Push English meaning
         questions.push(word.split(':')[0].trim())
         answers.push(word.split(':')[1].trim())
         // Push Vietnamese meaning
         questions.push(word.split(':')[1].trim())
         answers.push(word.split(':')[0].trim())
      }
      const q_random = Math.floor(Math.random()*questions.length)
      return {
         ans: answers[q_random].toLowerCase(),
         ques: questions[q_random].toLowerCase()
      }
   }
   const words_handle = (obj, answer, text) => {
      this.answer = String(answer.toLowerCase())
      const checkAnswer = answer.toLowerCase()==obj.ans
      const results = {
         isCorrect: false || checkAnswer,
         text: checkAnswer?text.correct:text.wrong
      }
      return Object.assign(results, obj)
   }
   let create_words = new_words(words_input.split('\n'))
   let words_quiz = prompt(`What does '${create_words.ques}' mean?`)
   let build_words = words_handle(create_words, words_quiz, {
      correct: `Congratulation, your answer is correct.\nThe answer is '${create_words.ans}'`,
      wrong: `Oh no, your answer is wrong!\nThe correct answer must be '${create_words.ans}'`})
   alert(build_words.text)
   quiz_system()
}
quiz_system()

/*
( Ví dụ: )
Input your new words:

Dog: Con chó
Cat: Con mèo

*/
