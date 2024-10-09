document.addEventListener('DOMContentLoaded', () => {
    const libraryForm = document.getElementById('add-library-form');
    const editButton = document.getElementById('edit-libraries');
    const addLibrarybutton = document.getElementById('addLibrary');
    let isEditing = false; // 判斷是否處於編輯模式
    let isrename = false;
    let oldlibraryname = '';
    let newlibraryname = '';

    // 加載所有單字庫並生成按鈕
    fetchLibraries();

    // 編輯按鈕的點擊事件
    editButton.addEventListener('click', () => {
        isEditing = !isEditing; // 切換編輯模式
        toggleDeleteButtons(isEditing);
    });

    // 當表單提交時，新增單字庫
    libraryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isrename) {
            const libraryName = document.getElementById('libraryname').value;

            if (libraryName) {
                // 新增單字庫並更新按鈕列表
                addLibrary(libraryName);
            }
        }
        else {
            isrename = false;
            newlibraryname = document.getElementById('libraryname').value;

            if(newlibraryname){
                renameLibrary(oldlibraryname,newlibraryname);
            }
        }
    });

    document.getElementById('gowordquiz').addEventListener('click', () => {
        // 取得選擇的測驗比例
        const selectedPercentage = document.querySelector('input[name="quiz-percentage"]:checked');

        if (!selectedPercentage) {
            alert('Please select a quiz percentage.');
            return;
        }

        const quizPercentage = selectedPercentage.value;

        // 取得所有勾選的 libraryname
        const selectedLibraries = [];
        const checkboxes = document.querySelectorAll('.library-checkbox:checked');

        checkboxes.forEach(checkbox => {
            selectedLibraries.push(checkbox.value);
        });

        if (selectedLibraries.length === 0) {
            alert('Please select at least one library.');
            return;
        }

        // 保存數據到 sessionStorage
        sessionStorage.setItem('quizPercentage', quizPercentage);
        sessionStorage.setItem('selectedLibraries', JSON.stringify(selectedLibraries));

        // 跳轉到測驗頁面 (word-quiz.html)
        window.location.href = 'word-quiz.html';
    });

    document.getElementById('goexplainquiz').addEventListener('click', () => {
        // 取得選擇的測驗比例
        const selectedPercentage = document.querySelector('input[name="quiz-percentage"]:checked');

        if (!selectedPercentage) {
            alert('Please select a quiz percentage.');
            return;
        }

        const quizPercentage = selectedPercentage.value;

        // 取得所有勾選的 libraryname
        const selectedLibraries = [];
        const checkboxes = document.querySelectorAll('.library-checkbox:checked');

        checkboxes.forEach(checkbox => {
            selectedLibraries.push(checkbox.value);
        });

        if (selectedLibraries.length === 0) {
            alert('Please select at least one library.');
            return;
        }

        // 保存數據到 sessionStorage
        sessionStorage.setItem('quizPercentage', quizPercentage);
        sessionStorage.setItem('selectedLibraries', JSON.stringify(selectedLibraries));

        // 跳轉到測驗頁面 (word-quiz.html)
        window.location.href = 'explain-quiz.html';
    });

    document.getElementById('godefinitionquiz').addEventListener('click', () => {
        // 取得選擇的測驗比例
        const selectedPercentage = document.querySelector('input[name="quiz-percentage"]:checked');

        if (!selectedPercentage) {
            alert('Please select a quiz percentage.');
            return;
        }

        const quizPercentage = selectedPercentage.value;

        // 取得所有勾選的 libraryname
        const selectedLibraries = [];
        const checkboxes = document.querySelectorAll('.library-checkbox:checked');

        checkboxes.forEach(checkbox => {
            selectedLibraries.push(checkbox.value);
        });

        if (selectedLibraries.length === 0) {
            alert('Please select at least one library.');
            return;
        }

        // 保存數據到 sessionStorage
        sessionStorage.setItem('quizPercentage', quizPercentage);
        sessionStorage.setItem('selectedLibraries', JSON.stringify(selectedLibraries));

        // 跳轉到測驗頁面 (word-quiz.html)
        window.location.href = 'definition-quiz.html';
    });



    // 動態生成單字庫按鈕和刪除按鈕
    function fetchLibraries() {
        fetch('/api/libraries')
            .then(response => response.json())
            .then(libraryNames => {
                const libraryButtonsContainer = document.getElementById('library-buttons');
                libraryButtonsContainer.innerHTML = ''; // 清空之前的按鈕

                libraryNames.forEach(libraryname => {
                    const container = document.createElement('div');
                    container.className = 'library-container';

                    // 創建按鈕
                    const button = document.createElement('button');
                    button.textContent = libraryname;
                    button.className = 'library-button';
                    button.addEventListener('click', () => {
                        window.location.href = `wordlist.html?libraryname=${encodeURIComponent(libraryname)}`;
                    });

                    // 創建刪除按鈕（默認隱藏）
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.className = 'delete-button';
                    deleteButton.style.display = 'none'; // 初始隱藏
                    deleteButton.addEventListener('click', () => {
                        deleteLibrary(libraryname, container);
                    });

                    const renameButton = document.createElement('button');
                    renameButton.textContent = 'Rename';
                    renameButton.className = 'rename-button';
                    renameButton.style.display = 'none';
                    renameButton.addEventListener('click', () => {
                        isrename = true;
                        addLibrarybutton.textContent = 'update Library';
                        document.getElementById('libraryname').value = libraryname;
                        oldlibraryname = libraryname;
                    });

                    // 創建勾選框
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = libraryname; // 這裡改為使用 libraryname
                    checkbox.classList.add('library-checkbox');

                    // 將按鈕和刪除按鈕、勾選框添加到容器
                    container.appendChild(checkbox); // 將勾選框添加到容器
                    container.appendChild(button);   // 將按鈕添加到容器
                    container.appendChild(renameButton);
                    container.appendChild(deleteButton); // 將刪除按鈕添加到容器
                    libraryButtonsContainer.appendChild(container); // 最後將容器添加到頁面
                });

            })
            .catch(error => console.error('Error fetching libraries:', error));
    }

    // 切換刪除按鈕的顯示
    function toggleDeleteButtons(isEditing) {
        const deleteButtons = document.querySelectorAll('.delete-button');
        const renameButtons = document.querySelectorAll('.rename-button');
        deleteButtons.forEach(button => {
            button.style.display = isEditing ? 'inline-block' : 'none'; // 顯示或隱藏
        });
        renameButtons.forEach(button => {
            button.style.display = isEditing ? 'inline-block' : 'none';
        });
    }


    function renameLibrary(oldlibraryname, newlibraryname) {
        fetch('/api/renameLibrary', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldlibraryname, newlibraryname }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Library renamed successfully');
                    fetchLibraries(); // 重新加載庫按鈕以反映變更
                    oldlibraryname = '';
                    newlibraryname = '';
                    document.getElementById('libraryname').value = '';
                } else {
                    console.error('Failed to rename library:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }


    // 刪除單字庫的函數
    function deleteLibrary(libraryname, container) {
        if (confirm(`Are you sure you want to delete the library: ${libraryname}?`)) {
            fetch(`/api/libraries/${encodeURIComponent(libraryname)}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (response.ok) {
                        // 成功刪除後，從前端移除該單字庫的顯示
                        container.remove();
                    } else {
                        alert('Failed to delete the library.');
                    }
                })
                .catch(error => console.error('Error deleting library:', error));
        }
    }

    function addLibrary(libraryName) {
        fetch('/api/addLibrary', { // 將路徑更改為 /api/addLibrary
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ libraryname: libraryName }), // 使用正確的庫名
        })
            .then(response => response.json())
            .then(() => {
                fetchLibraries(); // 成功後重新加載單字庫
                document.getElementById('libraryname').value = ''; // 清空輸入框
            })
            .catch(error => console.error('Error adding library:', error));
    }


});



