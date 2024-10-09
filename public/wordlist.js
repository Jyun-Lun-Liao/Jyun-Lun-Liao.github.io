document.addEventListener('DOMContentLoaded', () => {
    const addWordForm = document.getElementById('add-word-form');
    const inputs = addWordForm.querySelectorAll('input');
    const vocabularyList = document.getElementById('vocabulary-list');
    const editButton = document.getElementById('edit');
    const submitButton = document.getElementById('submit');
    const showDefinitionsButton = document.getElementById('show-all-definitions'); // 總顯示/隱藏按鈕
    let editMode = false;
    let showDefinition = true; // 初始狀態設為顯示所有定義
    let sorterrorcount = false;
    let sortAtoZ = false;
    let isEditMode = false;
    let newerrorcount = 0;
    document.getElementById('goback').addEventListener('click', function () {
        window.location.href = 'libraries.html';
    });

    // 取得 URL 中的 libraryname 參數
    const urlParams = new URLSearchParams(window.location.search);
    const libraryname = urlParams.get('libraryname'); // 獲取 'libraryname'

    // 如果有 libraryname，將其顯示在 h1 中
    if (libraryname) {
        const titleElement = document.getElementById('libraryname-title');
        titleElement.textContent = decodeURIComponent(libraryname);
    }


    fetchVocabularyByLibraryName(libraryname);

    function fetchVocabularyByLibraryName() {
        fetch(`/api/vocabulary/${encodeURIComponent(libraryname)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch words for library: ${libraryname}`);
                }
                return response.json();
            })
            .then(data => {
                renderVocabularyList(data.words);
            })
            .catch(error => console.error('Error:', error));
    }

    addWordForm.addEventListener('submit', (e) => {
        if (!isEditMode) {
            e.preventDefault();

            const word = document.getElementById('word').value;
            const speech = document.getElementById('speech').value;
            const definition = document.getElementById('definition').value;
            const explain = document.getElementById('explain').value;

            if (!word || !definition) {
                return;
            }

            const newWord = {
                libraryname,
                word,
                speech,
                errorcount: 0,
                definition,
                explain
            };

            fetch('/api/vocabulary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newWord),
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                })
                .catch(error => console.error('Error:', error));

            addWordForm.reset();
            inputs[0].focus();
        }
        else {
            isEditMode = !isEditMode;
            const updatedWordData = {
                word: document.getElementById('word').value,       // 更新後的單字
                speech: document.getElementById('speech').value,   // 更新後的詞性
                errorcount: newerrorcount,
                definition: document.getElementById('definition').value, // 更新後的定義
                explain: document.getElementById('explain').value  // 更新後的解釋
            };
            newerrorcount = 0;
            fetch(`/api/vocabulary/${encodeURIComponent(libraryname)}/${encodeURIComponent(currentWord)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedWordData),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update word');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Word updated successfully:', data);
                    window.location.reload();
                })
                .catch(error => console.error('Error:', error));
        }
        fetchVocabularyByLibraryName(libraryname);
    });

    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();

                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    addWordForm.requestSubmit();
                }
            }
        });
    });

    // 渲染單字列表
    function renderVocabularyList(vocabulary) {
        vocabularyList.innerHTML = '';
        vocabulary.forEach(item => {
            const wordElement = document.createElement('div');
            const speechElement = document.createElement('div');
            const errorcountElement = document.createElement('div');
            const definitionElement = document.createElement('span');
            const explainElement = document.createElement('div'); // 新增的 explain element
            const showDefinitionButton = document.createElement('button');
            const deleteButton = document.createElement('button');
            const updatewordButton = document.createElement('button');

            wordElement.innerHTML = `<strong>${item.word}</strong>`;
            speechElement.innerHTML = `(${item.speech}.)`;
            errorcountElement.innerHTML = `${item.errorcount}`;
            definitionElement.innerHTML = `${item.definition}`;
            explainElement.innerHTML = `Explain: ${item.explain || 'N/A'}`;

            wordElement.style.marginRight = '10px'; // 單字右邊距
            speechElement.style.marginRight = '10px'; // 語音右邊距
            errorcountElement.style.marginRight = '10px'; // 錯誤計數右邊距
            definitionElement.style.display = 'block'; // 定義為塊級元素
            definitionElement.style.marginTop = '5px'; // 定義上方間距
            explainElement.style.marginTop = '5px'; // 解釋上方間距
            explainElement.style.color = 'gray'; // 解釋文字顏色
            explainElement.style.fontStyle = 'italic'; // 解釋文字斜體

            // 初始時定義和 explain 顯示
            definitionElement.style.display = 'inline';
            speechElement.style.display = 'inline';
            errorcountElement.style.display = 'inline';
            explainElement.style.display = 'block';
            showDefinitionButton.style.visibility = 'hidden';

            // 單獨顯示或隱藏某個單字的定義和解釋
            showDefinitionButton.textContent = 'Hide Definition And Explain'; // 按鈕初始顯示的文字
            showDefinitionButton.addEventListener('click', () => {
                const isVisible = definitionElement.style.display === 'inline';

                // 隱藏或顯示定義和解釋
                definitionElement.style.display = isVisible ? 'none' : 'inline';
                explainElement.style.display = isVisible ? 'none' : 'block';

                // 更新按鈕文字
                showDefinitionButton.textContent = isVisible ? 'Show Definition And Explain' : 'Hide Definition And Explain';
            });

            // 將按鈕添加到單字元素中
            wordElement.appendChild(speechElement);
            wordElement.appendChild(errorcountElement);
            wordElement.appendChild(definitionElement);
            wordElement.appendChild(explainElement);
            wordElement.appendChild(showDefinitionButton);

            if (editMode) {
                deleteButton.textContent = 'Delete';
                updatewordButton.textContent = 'Update Word';
                deleteButton.addEventListener('click', () => {
                    deleteWord(item.word);
                });
                updatewordButton.addEventListener('click', () => {
                    editWord(item.word);
                });
                wordElement.appendChild(updatewordButton);
                wordElement.appendChild(deleteButton);
            }

            vocabularyList.appendChild(wordElement);
        });
    }
    showDefinitionsButton.addEventListener('click', newshowDefinitionsButton);
    // 切換顯示/隱藏所有定義和 explain
    showDefinitionsButton.textContent = 'Hide All Definitions And Explains';
    function newshowDefinitionsButton() {
        showDefinition = !showDefinition; // 切換顯示狀態
        const showDefinitionButtons = document.querySelectorAll('#vocabulary-list button');

        // 設定按鈕和定義/解釋的顯示狀態
        showDefinitionButtons.forEach(button => {
            const explainElement = button.previousElementSibling; // 獲取解釋元素
            const definitionElement = explainElement.previousElementSibling; // 獲取定義元素
            const errorcountElement = definitionElement.previousElementSibling; // 獲取錯誤計數元素
            const speechElement = errorcountElement.previousElementSibling; // 獲取發音元素
            if (showDefinition) {
                speechElement.style.display = 'inline';
                definitionElement.style.display = 'inline';
                errorcountElement.style.display = 'inline';
                explainElement.style.display = 'block';
                button.style.visibility = 'hidden';
            } else {
                definitionElement.style.display = 'none';
                explainElement.style.display = 'none';
                button.textContent = 'Show Definition And Explain'; // 更新按鈕文字
                button.style.visibility = 'visible'; // 確保按鈕顯示
            }
        });

        // 更新總按鈕的文字
        showDefinitionsButton.textContent = showDefinition ? 'Hide All Definitions And Explains' : 'Show All Definitions And Explains';
    };

    // 刪除單字
    function deleteWord(word) {
        fetch(`/api/vocabulary/${encodeURIComponent(libraryname)}/${encodeURIComponent(word)}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to delete word: ${word}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(data.message);
                fetchVocabularyByLibraryName(libraryname);
            })
            .catch(error => console.error('Error:', error));
    }

    editButton.addEventListener('click', () => {
        editMode = !editMode;
        fetchVocabularyByLibraryName(libraryname);
    });


    function editWord(word) {
        // 向 API 發送 GET 請求以獲取單字數據
        fetch(`/api/vocabulary/${encodeURIComponent(libraryname)}/${encodeURIComponent(word)}`, {
            method: 'GET',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch word data');
                }
                return response.json(); // 解析回應的 JSON 資料
            })
            .then(data => {
                // 檢查是否有數據返回
                if (data.word) {
                    // 將資料填入輸入框
                    document.getElementById('word').value = data.word;
                    document.getElementById('speech').value = data.speech;
                    document.getElementById('definition').value = data.definition;
                    document.getElementById('explain').value = data.explain;
                    newerrorcount = data.errorcount;
                    // 切換到編輯模式
                    isEditMode = true;
                    currentWord = data.word; // 保存當前正在編輯的單字

                    // 改變按鈕文字
                    submitButton.textContent = 'Update Word';
                } else {
                    console.error('Word data not found.');
                }
            })
            .catch(error => console.error('Error:', error));
    }


    document.getElementById('sorterrorcount').addEventListener('click', function () {
        sorterrorcount = !sorterrorcount;

        if (sorterrorcount) {
            fetch(`/api/vocabulary-sorted/${encodeURIComponent(libraryname)}`)
                .then(response => response.json())
                .then(data => {
                    // 在這裡處理排序後的單字列表
                    console.log('Sorted vocabulary:', data.sortedWords);

                    // 更新單字列表到網頁
                    renderVocabularyList(data.sortedWords); // 傳遞排序後的單字數據
                })
                .catch(error => console.error('Error fetching sorted vocabulary:', error));
        }
        else fetchVocabularyByLibraryName(libraryname);
    });

    document.getElementById('A-Z').addEventListener('click', function () {
        sortAtoZ = !sortAtoZ;

        if (sortAtoZ) {
            fetch(`/api/vocabulary-a-z/${encodeURIComponent(libraryname)}`) // 請求按字母排序的API
                .then(response => response.json())
                .then(data => {
                    console.log('Sorted by A-Z:', data.sortedWords);
                    renderVocabularyList(data.sortedWords); // 更新渲染排序後的數據
                })
                .catch(error => console.error('Error fetching sorted vocabulary:', error));
        }
        else fetchVocabularyByLibraryName(libraryname);
    });


});




