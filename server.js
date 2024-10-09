const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const cors = require('cors');
const path = require('path');
app.use(cors());

// 使用靜態文件夾來提供前端頁面
app.use(express.static('public'));

// 使用 body-parser 解析 JSON 請求
app.use(bodyParser.json());

// API 端點：根據 libraryName 返回該單字庫中的所有單字
app.get('/api/vocabulary/:libraryName', (req, res) => {
  const libraryName = req.params.libraryName;

  // 讀取現有的單字庫數據
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  // 返回該單字庫中的所有單字
  res.json({ libraryName, words: libraries[libraryName] });
});

// API 端點：根據 errorcount 對單字進行排序並返回
app.get('/api/vocabulary-sorted/:libraryName', (req, res) => {
  const libraryName = req.params.libraryName;

  // 讀取現有的單字庫數據
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  // 根據 errorcount 排序單字
  const sortedWords = libraries[libraryName].sort((a, b) => {
    return b.errorcount - a.errorcount; // 以 errorcount 降序排序 (從高到低)
  });

  // 返回排序後的單字列表
  res.json({ libraryName, sortedWords });
});


// 定義 API 路由來處理按字母順序排序
app.get('/api/vocabulary-a-z/:libraryName', (req, res) => {
  const libraryName = req.params.libraryName;

  // 讀取現有的單字庫數據
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  // 根據 errorcount 排序單字
  const sortedWords = libraries[libraryName].sort((a, b) => a.word.localeCompare(b.word));

  // 返回排序後的單字列表
  res.json({ libraryName, sortedWords });
});



// 刪除指定的單字庫及其所有單字
app.delete('/api/libraries/:libraryname', (req, res) => {
  const libraryName = req.params.libraryname;

  fs.readFile('vocabulary.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading data file' });
    }

    let vocabularyData;
    try {
      vocabularyData = JSON.parse(data);
    } catch (parseError) {
      return res.status(500).json({ error: 'Error parsing data file' });
    }

    if (!vocabularyData[libraryName]) {
      return res.status(404).json({ error: `Library "${libraryName}" not found` });
    }

    // 刪除指定的單字庫及其內容
    delete vocabularyData[libraryName];

    fs.writeFile('vocabulary.json', JSON.stringify(vocabularyData, null, 2), (writeError) => {
      if (writeError) {
        return res.status(500).json({ error: 'Error saving data' });
      }
      res.status(200).json({ message: `Library "${libraryName}" and its words deleted successfully` });
    });
  });
});

// API 端點：接收前端的單字並存儲到對應的 libraryName
app.post('/api/vocabulary', (req, res) => {
  const { libraryname, word, speech, definition, explain, errorcount } = req.body; // 確保使用 libraryname

  if (!word || !definition) {
    return res.status(400).json({ message: '單字、定義和單字庫名稱是必填的' });
  }

  // 讀取現有的單字庫數據
  let librariesData = fs.readFileSync('vocabulary.json', 'utf-8'); // 確保讀取數據
  let libraries = JSON.parse(librariesData); // 確保使用正確的變數

  // 檢查單字是否已經存在於該單字庫
  const wordExists = libraries[libraryname].find(item => item.word === word);
  if (wordExists) {
    return res.status(400).json({ message: '該單字已經存在於此單字庫中' });
  }

  // 添加新單字到對應的單字庫
  libraries[libraryname].push({ word, speech, errorcount, definition, explain });

  // 將更新後的數據寫入 JSON 文件
  fs.writeFileSync('vocabulary.json', JSON.stringify(libraries, null, 2), 'utf-8');

  res.json({ message: '單字已成功新增至單字庫', libraryname });
});


// API 端點：刪除特定單字庫中的單字
app.delete('/api/vocabulary/:libraryName/:word', (req, res) => {
  const { libraryName, word } = req.params; // 從 URL 取得 libraryName 和 word

  // 讀取現有的單字庫數據
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  // 找到該單字在單字庫中的索引
  const index = libraries[libraryName].findIndex(item => item.word === word);

  // 刪除該單字
  libraries[libraryName].splice(index, 1);

  // 將更新後的數據寫入 JSON 文件
  fs.writeFileSync('vocabulary.json', JSON.stringify(libraries, null, 2), 'utf-8');

  res.json({ message: `單字 ${word} 已成功從單字庫 ${libraryName} 中刪除` });
});


app.get('/api/vocabulary/:libraryName/:word', (req, res) => {
  const { libraryName, word } = req.params; // 從 URL 取得 libraryName 和 word

  // 讀取現有的單字庫數據
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  // 找到該單字在單字庫中的索引
  const index = libraries[libraryName].findIndex(item => item.word === word);

  // 提取指定單字的資料
  const { word: foundWord, speech, errorcount, definition, explain } = libraries[libraryName][index];

  // 回傳該單字的資料
  res.json({ word: foundWord, speech, errorcount, definition, explain });

});

// API 端點：更新特定單字庫中的單字
app.put('/api/vocabulary/:libraryName/:word', (req, res) => {
  const { libraryName, word } = req.params; // 從 URL 取得 libraryName 和 word
  const updatedWordData = req.body; // 從請求的 body 取得更新後的數據

  // 讀取現有的單字庫數據
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  // 檢查該單字庫是否存在
  if (!libraries[libraryName]) {
      return res.status(404).json({ message: 'Library not found' });
  }

  // 找到該單字在單字庫中的索引
  const index = libraries[libraryName].findIndex(item => item.word === word);

  if (index === -1) {
      return res.status(404).json({ message: 'Word not found' });
  }

  // 更新單字的數據
  libraries[libraryName][index] = updatedWordData;

  // 將更新後的單字庫數據寫回到 JSON 檔案
  fs.writeFileSync('vocabulary.json', JSON.stringify(libraries, null, 2));

  res.json({ message: 'Word updated successfully', updatedWord: updatedWordData });
});


// POST 端點：新增 libraryname 到 vocabulary.json
app.post('/api/addLibrary', (req, res) => {
  const { libraryname } = req.body; // 從請求中獲取 libraryname

  if (!libraryname) {
    return res.status(400).json({ message: '請提供單字庫名稱' });
  }

  // 讀取現有的 vocabulary.json 文件
  let librariesData;
  try {
    librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  } catch (err) {
    return res.status(500).json({ message: '無法讀取資料庫文件' });
  }

  // 將資料轉換為 JSON 格式
  let libraries = JSON.parse(librariesData);

  // 檢查該單字庫是否已存在
  if (libraries[libraryname]) {
    return res.status(400).json({ message: '該單字庫已經存在' });
  }

  // 如果不存在，創建一個新的單字庫
  libraries[libraryname] = [];

  // 將更新後的資料寫回到 vocabulary.json
  try {
    fs.writeFileSync('vocabulary.json', JSON.stringify(libraries, null, 2), 'utf-8');
  } catch (err) {
    return res.status(500).json({ message: '無法寫入資料庫文件' });
  }

  res.json({ message: `成功新增單字庫: ${libraryname}` });
});


// 提供 libraryname 資料的 API
app.get('/api/libraries', (req, res) => {
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  const libraryNames = Object.keys(libraries); // 獲取所有單字庫名稱
  res.json(libraryNames); // 回傳單字庫名稱的列表
});

app.post('/api/vocabulary/libraries', (req, res) => {
  const { libraries } = req.body; // 獲取庫名

  // 讀取現有的單字庫數據
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const librariesContent = JSON.parse(librariesData);

  // 用於存儲所有選定庫的單字資料
  const selectedVocabulary = [];

  libraries.forEach(libraryName => {
      if (librariesContent[libraryName]) {
          selectedVocabulary.push(...librariesContent[libraryName]); // 收集單字
      }
  });

  res.json(selectedVocabulary); // 返回單字資料
});



// 新增一個 API 來更新庫的名稱
app.put('/api/renameLibrary', (req, res) => {
  const { oldlibraryname, newlibraryname } = req.body; // 取得舊名稱和新名稱
  const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
  const libraries = JSON.parse(librariesData);

  // 檢查舊名稱是否存在於庫中
  if (libraries[oldlibraryname]) {
      // 將舊庫內容複製到新庫名稱
      libraries[newlibraryname] = libraries[oldlibraryname];

      // 刪除舊的庫名稱
      delete libraries[oldlibraryname];

      // 將更新後的庫寫回文件
      fs.writeFileSync('vocabulary.json', JSON.stringify(libraries, null, 2), 'utf-8');
      res.json({ success: true });
  } else {
      res.status(400).json({ success: false, message: 'Library not found' });
  }
});



app.post('/api/updateErrorCount', (req, res) => {
  try {
      const { libraryName, word, errorcount } = req.body; // 從請求中解構出數據

      if (!libraryName || libraryName.length === 0 || !word || errorcount === undefined) {
          return res.status(400).json({ error: 'Invalid input data' });
      }

      // 讀取現有的 vocabulary.json 文件
      const librariesData = fs.readFileSync('vocabulary.json', 'utf-8');
      const libraries = JSON.parse(librariesData);

      // 遍歷每個選擇的 libraryName，更新每個庫中的單字錯誤次數
      libraryName.forEach(library => {
          if (!libraries[library]) {
              console.error(`Library ${library} not found`);
              return; // 如果找不到該庫，跳過這個庫
          }

          const index = libraries[library].findIndex(item => item.word === word);

          if (index === -1) {
              console.error(`Word ${word} not found in library ${library}`);
              return; // 如果找不到該單字，跳過這個庫
          }

          // 更新該單字的錯誤次數
          libraries[library][index].errorcount = errorcount;
      });

      // 將更新後的數據寫回文件
      fs.writeFileSync('vocabulary.json', JSON.stringify(libraries, null, 2));

      res.json({ message: 'Error counts updated successfully for selected libraries' });
  } catch (error) {
      console.error('Error updating error counts:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'libraries.html'));
});


// 啟動伺服器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});