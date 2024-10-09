document.getElementById('goback').addEventListener('click', function () {
    window.location.href = 'libraries.html';
});
document.getElementById('again').addEventListener('click', function () {
    window.location.reload();
});

const quizPercentage = sessionStorage.getItem('quizPercentage');
const selectedLibraries = JSON.parse(sessionStorage.getItem('selectedLibraries'));

if (quizPercentage && selectedLibraries) {
    console.log('Selected Percentage:', quizPercentage);
    console.log('Selected Libraries:', selectedLibraries);

    // 更新頁面顯示
    document.getElementById('quiz-percentage-display').textContent = `${quizPercentage}%`;

    // 將 h1 改為所有選中的 libraryname
    const libraryNamesString = selectedLibraries.join(', '); // 將 array 轉換成字串
    document.getElementById('quiz-title').textContent = `${libraryNamesString}`; // 更新 h1 的內容
} else {
    console.error('No quiz data found in sessionStorage.');
}

document.addEventListener('DOMContentLoaded', () => {
    const selectedLibraries = JSON.parse(sessionStorage.getItem('selectedLibraries'));
    const quizPercentage = sessionStorage.getItem('quizPercentage');

    if (selectedLibraries && selectedLibraries.length > 0) {
        // 向後端請求選定庫名的單字資料
        fetch('/api/vocabulary/libraries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ libraries: selectedLibraries }),
        })
            .then(response => response.json())
            .then(vocabulary => {
                const totalWords = vocabulary.length; // 獲取單字總數

                // 計算測試的單字數量
                const percentage = parseInt(quizPercentage, 10); // 將字串轉換為整數
                let quizCount = Math.ceil((percentage / 100) * totalWords); // 根據百分比計算單字數量

                // 確保至少有一個單字
                if (quizCount < 1) {
                    quizCount = 1;
                }

                // 打亂單字順序
                const shuffledVocabulary = shuffleArray(vocabulary);
                // 獲取所需數量的單字
                const selectedVocabulary = shuffledVocabulary.slice(0, quizCount);

                generateQuiz(selectedVocabulary); // 使用選擇的單字生成測驗
            })
            .catch(error => console.error('Error fetching vocabulary:', error));
    } else {
        console.error('No libraries selected.');
    }
});

// 打亂數組的函數
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


function generateQuiz(vocabulary) {
    const quizContainer = document.getElementById('quiz-container');
    const submitQuizButton = document.getElementById('submit-quiz');
    submitQuizButton.style.display = 'block'; // 顯示提交按鈕

    vocabulary.forEach((word, index) => {
        // 每個單字生成一個問題區塊
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('quiz-question');

        // 顯示單字
        const questionText = document.createElement('p');
        questionText.textContent = `What is the word for "(${word.speech}.) ${word.definition}"?`;
        questionDiv.appendChild(questionText);

        // 建立一個輸入框讓使用者輸入答案
        const answerInput = document.createElement('input');
        answerInput.type = 'text';
        answerInput.name = `answer-${index}`;
        answerInput.dataset.correctAnswer = word.word; // 正確答案
        answerInput.autocomplete = "off";

        // 新增事件監聽器，當按下Enter時跳到下一個輸入框
        answerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 防止表單提交
                const nextInput = document.querySelector(`input[name="answer-${index + 1}"]`);
                if (nextInput) {
                    nextInput.focus(); // 移動到下一個輸入框
                } else {
                    // 如果是最後一個輸入框，則模擬提交
                    submitQuizButton.focus();
                }
            }
        });

        questionDiv.appendChild(answerInput);
        quizContainer.appendChild(questionDiv);
    });

    // 提交按鈕的點擊事件
    submitQuizButton.addEventListener('click', () => {
        checkAnswers(vocabulary);
    });
}

function checkAnswers(vocabulary) {
    let correctAnswers = 0;
    const totalQuestions = vocabulary.length;

    vocabulary.forEach((word, index) => {
        const answerInput = document.querySelector(`input[name="answer-${index}"]`);
        const userAnswer = answerInput.value.trim();
        const correctAnswer = answerInput.dataset.correctAnswer;

        // 檢查使用者的答案是否正確
        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            correctAnswers++;
            answerInput.style.backgroundColor = 'lightgreen'; // 答對顯示綠色
            answerInput.style.borderColor = 'lightgreen';
        } else {
            answerInput.style.backgroundColor = 'lightcoral'; // 答錯顯示紅色
            answerInput.style.borderColor = 'lightcoral';

            const correctanswer = document.createElement('div');
            correctanswer.textContent = `Correct Answer is: ${word.word}`;
            correctanswer.style.color = 'lightgreen';
            answerInput.parentNode.insertBefore(correctanswer, answerInput.nextSibling);


            word.errorcount++;

            // 發送 API 更新錯誤次數
            fetch('/api/updateErrorCount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    libraryName: selectedLibraries,  // 當前的單字庫
                    word: word.word,  // 單字
                    errorcount: word.errorcount,  // 更新後的錯誤次數
                }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Error count updated successfully');
                    } else {
                        console.error('Failed to update error count');
                    }
                })
                .catch(error => console.error('Error:', error));
        }
    });
    // 隱藏提交按鈕
    const submitQuizButton = document.getElementById('submit-quiz');
    submitQuizButton.style.display = 'none';

    const resultDiv = document.getElementById('result');
    resultDiv.textContent = `You got ${correctAnswers} out of ${totalQuestions} correct.`;
}
