// 繁體(正體)中文-台灣

export default {
  'commands': {
    'lint-file': {
      'name': '格式化目前檔案',
      'error-message': '在檔案中格式化檔案錯誤',
    },
    'lint-file-unless-ignored': {
      'name': '格式化目前檔案，除非被忽略',
    },
    'lint-all-files': {
      'name': '格式化儲存庫中的所有檔案',
      'error-message': '在檔案中格式化所有檔案錯誤',
      'success-message': '已格式化所有檔案',
      'errors-message-singular': '已格式化所有檔案，但有 1 個錯誤。',
      'errors-message-plural': '已格式化所有檔案，但有 {NUM} 個錯誤。',
      'start-message': '這將會編輯您的所有檔案，並可能導致錯誤。',
      'submit-button-text': '全部格式化',
      'submit-button-notice-text': '正在格式化所有檔案中...',
    },
    'lint-all-files-in-folder': {
      'name': '格式化目前資料夾中的所有檔案',
      'start-message': '這將會編輯您在 {FOLDER_NAME} 中的所有檔案，包含其子資料夾中的檔案，這可能會導致錯誤。',
      'submit-button-text': '格式化 {FOLDER_NAME} 中的所有檔案',
      'submit-button-notice-text': '正在格式化 {FOLDER_NAME} 中的所有檔案...',
      'error-message': '在資料夾中格式化所有檔案錯誤',
      'success-message': '已格式化 {FOLDER_NAME} 中的所有 {NUM} 個檔案。',
      'message-singular': '已格式化 {FOLDER_NAME} 中的所有 {NUM} 個檔案，但有 1 個錯誤。',
      'message-plural': '已格式化 {FOLDER_NAME} 中的所有 {FILE_COUNT} 個檔案，但有 {ERROR_COUNT} 個錯誤。',
    },
    'paste-as-plain-text': {
      'name': '以純文字貼上且不做修改',
    },
    'ignore-folder': {
      'name': '忽略資料夾',
    },
    'ignore-file': {
      'name': '忽略檔案',
    },
    'lint-file-pop-up-menu-text': {
      'name': '格式化檔案',
    },
    'lint-folder-pop-up-menu-text': {
      'name': '格式化資料夾',
    },
    'ignore-file-pop-up-menu-text': {
      'name': '在 Linter 中忽略檔案',
    },
    'ignore-folder-pop-up-menu-text': {
      'name': '在 Linter 中忽略資料夾',
    },
      'preview-lint-file': {        'name': '預覽目前檔案的 Lint 變更',
},
},

  'logs': {
    'plugin-load': '正在載入外掛',
    'plugin-unload': '正在卸載外掛',
    'folder-lint': '正在格式化資料夾 ',
    'linter-run': '正在執行 Linter',
    'file-change-yaml-lint-run': '正在執行編輯器內容變更 YAML 格式化',
    'file-change-yaml-lint-skipped': '未偵測到檔案變更，因此跳過 YAML 格式化',
    'file-change-yaml-lint-warning': '沒有檔案資訊，但 debounce 已執行。某處發生錯誤。',
    'paste-link-warning': '已中止貼上格式化，因為剪貼簿內容是連結，這樣做可以避免與其他修改貼上行為的外掛發生衝突。',
    'see-console': '詳情請見主控台。',
    'unknown-error': '格式化期間發生未知錯誤。',
    'moment-locale-not-found': '嘗試將 Moment.js 地區設定切換為 {MOMENT_LOCALE}，但得到 {CURRENT_LOCALE}',
    'file-change-lint-message-start': '已格式化',

    // rules-runner.ts
    'pre-rules': '一般規則之前的規則',
    'post-rules': '一般規則之後的規則',
    'rule-running': '正在執行規則',
    'custom-regex': '自訂正規表示式規則',
    'running-custom-regex': '正在執行自訂正規表示式',

    // rules-runner.ts and rule-builder.ts
    'disabled-text': '已停用',

    // rule-builder.ts
    'run-rule-text': '正在執行',

    // logger.ts
    'timing-key-not-found': '計時金鑰 \'{TIMING_KEY}\' 不存在於計時資訊清單中，因此被忽略',
    'milliseconds-abbreviation': '毫秒',

    'invalid-date-format-error': `建立日期 '{DATE}' 的格式無法解析或確定，因此在 '{FILE_NAME}' 中保留了建立日期`,

    // yaml.ts
    'invalid-delimiter-error-message': '分隔符號只允許為單一字元',

    // mdast.ts
    'missing-footnote-error-message': `註腳 '{FOOTNOTE}' 在註腳內容之前沒有對應的註腳參考，無法處理。請確保所有註腳在註腳內容之前都有對應的參考。`,
    'too-many-footnotes-error-message': `註腳鍵 '{FOOTNOTE_KEY}' 有超過一個註腳參考它。請更新註腳，以便每個註腳鍵只有一個註腳。`,

    // rules.ts
    'wrapper-yaml-error': 'YAML 中有錯誤：{ERROR_MESSAGE}',
    'wrapper-unknown-error': '未知錯誤：{ERROR_MESSAGE}',
      'error-message-format': '「{RULE_NAME}」遇到 {ERROR_MESSAGE}',
  'overlapping-replacements-error': '規則替換必須有序且互不重疊',
  'paragraph-gap-conflict-error': '共享同一空隙的段落必須使用相同的替換',
  'protected-ranges-combine-error': '非 lint 上下文產生的保護區間無法與更多忽略類型合併',
  'protected-ranges-projection-error': '非 lint 上下文產生的保護區間無法提供投影',
  'invalid-projection-replacements-error': '投影替換必須是有序、非空且互不重疊的源區間，且替換令牌非空',
  'unexpected-pre-table-content': '修剪表格列開頭時出現意外結果：在表格列「{TABLE_ROW}」之前的引用區塊中發現了非空白內容，行首為「{START_OF_LINE}」。',
},

  'notice-text': {
    'empty-clipboard': '剪貼簿中沒有內容。',
    'characters-added': '個字元被添加',
    'characters-removed': '個字元被移除',
      'lint-preview-title': 'Lint 預覽',
  'apply-lint-preview': '套用',
  'no-preview-changes': '無變更。',
  'show-diff': '顯示差異',
  'diff-large-file-warning': '檔案較大，已跳過差異渲染，需要時點擊下方按鈕查看。',
  'diff-skipped-lines': '已摺疊 {COUNT} 行未變更內容',
  'diff-summary': '+{LINES_ADDED} 行 / -{LINES_REMOVED} 行，+{CHARS_ADDED} 字元 / -{CHARS_REMOVED} 字元',
},

  // rule-alias-suggester.ts
  'all-rules-option': '全部',

  // settings.ts
  'linter-title': 'Linter',
  'empty-search-results-text': '沒有符合搜尋的設定',

  // lint-confirmation-modal.ts
  'warning-text': '警告',
  'file-backup-text': '請確定您已備份檔案。',
  'cancel-button-text': '取消',
  'do-not-show-again': '不再顯示此確認',

  'disabled-other-rule-notice': '如果您啟用 <code>{NAME_1}</code>，它將停用 <code>{NAME_2}</code>。您要繼續嗎？',
  'disabled-conflicting-rule-notice': '{NAME_1} 與 {NAME_2} 衝突，因此已被關閉。您可以在設定分頁中切換要關閉的設定。',

  // confirm-rule-disable-modal.ts
  'ok': '確定',

  // parse-results-modal.ts
  'parse-results-heading-text': '自訂解析值',
  'file-parse-description-text': '以下是在 {FILE} 中找到的自訂取代項目清單。',
  'no-parsed-values-found-text': '在 {FILE} 中找不到自訂取代項目。請確保 {FILE} 中所有具有自訂取代項目的表格都只有兩欄，且所有列都以管道符號（即 |）開頭和結尾。',
  'find-header-text': '要尋找的字詞',
  'replace-header-text': '取代字詞',
  'close-button-text': '關閉',

  'tabs': {
    'names': {
      // tab.ts
      'general': '一般',
      'custom': '自訂',
      'yaml': 'YAML',
      'heading': '標題',
      'content': '內容',
      'footnote': '註腳',
      'spacing': '間距',
      'paste': '貼上',
      'debug': '偵錯',
    },
    'general': {
      // general-tab.ts
      'lint-on-save': {
        'name': '儲存時格式化',
        'description': '在手動儲存檔案時格式化檔案（當按下 <code>Ctrl + S</code> 或在使用 vim 按鍵綁定時執行 <code>:w</code>）',
      },
      'display-message': {
        'name': '格式化時顯示訊息',
        'description': '格式化後顯示變更的字元數',
      },
      'lint-on-file-change': {
        'name': '焦點檔案變更時格式化',
        'description': '當檔案關閉或切換到新檔案時，會格式化前一個檔案。',
      },
      'display-lint-on-file-change-message': {
        'name': '顯示檔案變更時格式化訊息',
        'description': '當 <code>焦點檔案變更時格式化</code> 發生時顯示訊息',
      },
      'folders-to-ignore': {
        'name': '要忽略的資料夾',
        'description': '在格式化所有檔案或儲存時格式化時要忽略的資料夾。',
        'folder-search-placeholder-text': '資料夾名稱',
        'add-input-button-text': '新增另一個要忽略的資料夾',
              'empty-state': '尚無被忽略的資料夾。',
},
      'files-to-ignore': {
        'name': '要忽略的檔案',
        'description': '在格式化所有檔案或儲存時格式化時要忽略的檔案。',
        'file-search-placeholder-text': '要忽略的檔案的正規表示式',
        'add-input-button-text': '新增另一個要忽略的檔案的正規表示式',
        'label-placeholder-text': '標籤',
        'flags-placeholder-text': '旗標',
              'empty-state': '尚無被忽略的檔案。',
  'pattern-required': '必須填寫匹配模式',
},
      'additional-file-extensions': {
        'name': '額外的檔案副檔名',
        'description': '除了 md 之外要進行 Lint 的檔案副檔名。例如 mdx 或 svx。請勿包含開頭的點號。<b>注意：不論新增哪些副檔名，只有 Obsidian 視為 Markdown 的檔案（無論是內建或透過其他外掛）才會被 Lint。</b>',
        'extension-placeholder': '例如：mdx',
        'add-input-button-text': '新增副檔名',
              'empty-state': '尚無額外的檔案副檔名。',
},
      'yaml-aliases-section-style': {
        'name': 'YAML 別名區段樣式',
        'description': 'YAML 別名區段的樣式',
      },
      'yaml-tags-section-style': {
        'name': 'YAML 標籤區段樣式',
        'description': 'YAML 標籤區段的樣式',
      },
      'default-array-style': {
        'name': '預設 YAML 陣列區段樣式',
        'description': '其他 YAML 陣列的樣式，這些陣列不是 <code>tags</code>、<code>aliases</code> 或在 <code>強制鍵值為單行陣列</code> 和 <code>強制鍵值為多行陣列</code> 中的陣列',
      },
      'default-escape-character': {
        'name': '預設逸出字元',
        'description': '當單引號和雙引號不存在時，用於逸出 YAML 值的預設字元。',
      },
      'remove-unnecessary-escape-chars-in-multi-line-arrays': {
        'name': '在多行陣列格式中移除不必要的逸出字元',
        'description': '多行 YAML 陣列的逸出字元不需要與單行陣列相同的逸出，因此在多行格式中移除不必要的額外逸出',
      },
      'number-of-dollar-signs-to-indicate-math-block': {
        'name': '表示數學區塊的錢字號數量',
        'description': '將數學內容視為數學區塊而非行內數學的錢字號數量',
              'invalid': '請輸入不小於 1 的整數。',
},
          'enable-diff-preview-view': {            'name': '啟用工作區差異預覽',
  'description': '在可停駐的工作區檢視中顯示 lint 預覽命令。關閉後將關閉預覽檢視並隱藏預覽命令。',
},
  'rules': '規則',
  'yaml': 'YAML 通用樣式',
},
    'debug': {
      // debug-tab.ts
      'log-level': {
        'name': '日誌層級',
        'description': '服務允許記錄的日誌類型。預設為 ERROR。',
      },
      'linter-config': {
        'name': 'Linter 設定',
        'description': '截至設定頁面載入時，Linter 的 data-linter.json 內容',
      },
      'log-collection': {
        'name': '在儲存時格式化和格式化目前檔案時收集日誌',
        'description': '在您 <code>儲存時格式化</code> 和格式化目前檔案時收集日誌。這些日誌有助於偵錯和建立錯誤報告。',
      },
      'linter-logs': {
        'name': 'Linter 日誌',
        'description': '如果啟用，則為上次 <code>儲存時格式化</code> 或上次格式化目前檔案執行的日誌。',
      },
    },
  },

  'options': {
    'custom-replace': {
      // custom-replace-option.ts
      'name': '自訂正規表示式取代',
      'description': '自訂正規表示式取代可用於將任何符合尋找正規表示式的內容取代為取代值。取代和尋找值都必須是有效的正規表示式值。',
      'add-input-button-text': '新增正規表示式取代',
      'regex-to-find-placeholder-text': '要尋找的正規表示式',
      'flags-placeholder-text': '旗標',
      'regex-to-replace-placeholder-text': '要取代的正規表示式',
      'label-placeholder-text': '標籤',
          'edit-tooltip': '編輯',
  'empty-state': '尚未新增自訂正規表示式替換。',
  'enabled': '啟用',
  'invalid-regex': '無效的正規表示式',
},
  },

  // rules
  'rules': {
    // add-blank-line-after-yaml.ts
    'add-blank-line-after-yaml': {
      'name': '在 YAML 後新增空白行',
      'description': '在 YAML 區塊後新增一個空白行，如果它不是目前檔案的結尾，或者它後面還沒有至少一個空白行',
    },
    // blockquotify-on-paste.ts
    'add-blockquote-indentation-on-paste': {
      'name': '貼上時新增區塊引言縮排',
      'description': '在貼上期間，當游標位於區塊引言/引文行時，為除第一行外的所有行新增區塊引言',
    },
    // blockquote-style.ts
    'blockquote-style': {
      'name': '區塊引言樣式',
      'description': '確保區塊引言樣式一致。',
      'style': {
        'name': '樣式',
        'description': '用於區塊引言指示符的樣式',
      },
    },
    // capitalize-headings.ts
    'capitalize-headings': {
      'name': '標題大寫',
      'description': '標題應以大寫格式化',
      'style': {
        'name': '樣式',
        'description': '要使用的大寫樣式',
      },
      'ignore-case-words': {
        'name': '忽略大小寫單字',
        'description': '僅將標題大小寫樣式應用於全小寫的單字',
      },
      'ignore-words': {
        'name': '忽略單字',
        'description': '大寫時要忽略的以逗號分隔的單字清單',
              'empty-state': '尚無要忽略的單字。',
  'placeholder-text': '要忽略的單字',
},
      'lowercase-words': {
        'name': '小寫單字',
        'description': '要保持小寫的以逗號分隔的單字清單',
              'empty-state': '尚無要小寫的單字。',
  'placeholder-text': '要小寫的單字',
},
          'ending-word-ignore-characters': {            'name': '潛在單字結尾需忽略的字元',
  'description': '這些字元可以跟在字母、單引號或連字符號之後，且該串仍被視為一個單字',
},
  'starting-word-ignore-characters': {    'name': '潛在單字開頭需忽略的字元',
  'description': '這些字元可以單獨出現在字母、單引號或連字符號之前，且該串仍被視為一個單字',
},
},
    // compact-yaml.ts
    'compact-yaml': {
      'name': '緊湊 YAML',
      'description': '移除 YAML front matter 中的前導和尾隨空白行。',
      'inner-new-lines': {
        'name': '內部新行',
        'description': '移除不在 YAML 開頭或結尾的新行',
      },
    },
    // consecutive-blank-lines.ts
    'consecutive-blank-lines': {
      'name': '連續空白行',
      'description': '最多只能有一個連續的空白行。',
    },
    // convert-bullet-list-markers.ts
    'convert-bullet-list-markers': {
      'name': '轉換項目符號清單標記',
      'description': '將常見的項目符號清單標記符號轉換為 Markdown 清單標記。',
    },
    // convert-spaces-to-tabs.ts
    'convert-spaces-to-tabs': {
      'name': '將空格轉換為定位點',
      'description': '將前導空格轉換為定位點。',
      'tabsize': {
        'name': '定位點大小',
        'description': '將轉換為定位點的空格數',
      },
    },
    // dedupe-yaml-array-values.ts
    'dedupe-yaml-array-values': {
      'name': '移除 YAML 陣列重複值',
      'description': '以區分大小寫的方式移除重複的陣列值。',
      'dedupe-alias-key': {
        'name': '移除 YAML 別名區段重複值',
        'description': '開啟移除重複別名的功能。',
      },
      'dedupe-tag-key': {
        'name': '移除 YAML 標籤區段重複值',
        'description': '開啟移除重複標籤的功能。',
      },
      'dedupe-array-keys': {
        'name': '移除 YAML 陣列區段重複值',
        'description': '開啟移除一般 YAML 陣列重複值的功能',
      },
      'ignore-keys': {
        'name': '若要忽略的 YAML 鍵，以便對 YAML 陣列值進行去重',
        'description': '一個 YAML 鍵的清單，每行一個，不含結尾的冒號，這些鍵不應移除重複值。',
              'empty-state': '尚無要去重的 YAML 鍵。',
  'placeholder-text': '要去重的 YAML 鍵',
},
    },
    // default-language-for-code-fences.ts
    'default-language-for-code-fences': {
      'name': '程式碼區塊的預設語言',
      'description': '為未指定語言的程式碼區塊新增預設語言。',
      'default-language': {
        'name': '程式語言',
        'description': '留空則不執行任何操作。語言標籤可在此處找到 <a href="https://prismjs.com/#supported-languages">這裡</a>。',
      },
    },
    // emphasis-style.ts
    'emphasis-style': {
      'name': '強調樣式',
      'description': '確保強調樣式一致。',
      'style': {
        'name': '樣式',
        'description': '用於表示強調內容的樣式',
      },
    },
    // empty-line-around-blockquotes.ts
    'empty-line-around-blockquotes': {
      'name': '區塊引言周圍的空白行',
      'description': '確保區塊引言周圍有空白行，除非它們在文件的開頭或結尾。<b>注意：空白行可以是少一層巢狀的區塊引言，也可以是換行字元。</b>',
    },
    // empty-line-around-code-fences.ts
    'empty-line-around-code-fences': {
      'name': '程式碼區塊周圍的空白行',
      'description': '確保程式碼區塊周圍有空白行，除非它們在文件的開頭或結尾。',
    },
    // empty-line-around-math-block.ts
    'empty-line-around-math-blocks': {
      'name': '數學區塊周圍的空白行',
      'description': '確保數學區塊周圍有空白行，使用 <code>表示數學區塊的錢字號數量</code> 來決定多少個錢字號表示單行數學的數學區塊。',
    },
    // empty-line-around-tables.ts
    'empty-line-around-tables': {
      'name': '表格周圍的空白行',
      'description': '確保 github 風格的表格周圍有空白行，除非它們在文件的開頭或結尾。',
    },
    // escape-yaml-special-characters.ts
    'escape-yaml-special-characters': {
      'name': '逸出 YAML 特殊字元',
      'description': '在 YAML 中逸出後面有空格的冒號（: ）、單引號（\'）和雙引號（"）。',
      'try-to-escape-single-line-arrays': {
        'name': '嘗試逸出單行陣列',
        'description': '假設陣列以 \'[\' 開頭，以 \']\' 結尾，且項目以 \',\' 分隔，嘗試逸出陣列值。',
      },
    },
    // file-name-heading.ts
    'file-name-heading': {
      'name': '檔名標題',
      'description': '如果不存在 H1 標題，則將檔名作為 H1 標題插入。',
    },
    // footnote-after-punctuation.ts
    'footnote-after-punctuation': {
      'name': '註腳在標點符號後',
      'description': '確保註腳參考放在標點符號之後，而不是之前。',
    },
    // force-yaml-escape.ts
    'force-yaml-escape': {
      'name': '強制 YAML 逸出',
      'description': '逸出指定 YAML 鍵的值。',
      'force-yaml-escape-keys': {
        'name': '在鍵上強制 YAML 逸出',
        'description': '在指定的 YAML 鍵上使用 YAML 逸出字元，以換行字元分隔，如果尚未逸出。請勿在 YAML 陣列上使用。',
              'empty-state': '尚無要強制轉義值的 YAML 鍵。',
  'placeholder-text': '要轉義其值的 YAML 鍵',
},
    },
    // format-tags-in-yaml.ts
    'format-tags-in-yaml': {
      'name': '格式化 YAML 中的標籤',
      'description': '從 YAML frontmatter 中的標籤移除井字號，因為它們會使那裡的標籤無效。',
    },
    // format-yaml-array.ts
    'format-yaml-array': {
      'name': '格式化 YAML 陣列',
      'description': '允許將一般 YAML 陣列格式化為多行或單行，且 <code>tags</code> 和 <code>aliases</code> 允許使用一些 Obsidian 特定的 YAML 格式。<b>注意：單一字串到單行是從單一字串項目變為單行陣列，如果存在多於一個項目。單一字串到多行也是如此，只是它會變成多行陣列。</b>',
      'alias-key': {
        'name': '格式化 YAML 別名區段',
        'description': '開啟 YAML 別名區段的格式化功能。您不應將此選項與 <code>YAML 標題別名</code> 規則一起啟用，因為它們可能無法很好地協同工作，或者它們可能選擇了不同的格式樣式，導致意外結果。',
      },
      'tag-key': {
        'name': '格式化 YAML 標籤區段',
        'description': '開啟 YAML 標籤區段的格式化功能。',
      },
      'default-array-keys': {
        'name': '格式化 YAML 陣列區段',
        'description': '開啟一般 YAML 陣列的格式化功能',
      },
      'force-single-line-array-style': {
        'name': '強制鍵值為單行陣列',
        'description': '強制以換行分隔的鍵的 YAML 陣列為單行格式（留空以停用此選項）',
              'empty-state': '尚無要強制單行陣列格式的 YAML 陣列鍵。',
  'placeholder-text': '要強制單行格式的 YAML 陣列鍵',
},
      'force-multi-line-array-style': {
        'name': '強制鍵值為多行陣列',
        'description': '強制以換行分隔的鍵的 YAML 陣列為多行格式（留空以停用此選項）',
              'empty-state': '尚無要強制多行陣列格式的 YAML 陣列鍵。',
  'placeholder-text': '要強制多行格式的 YAML 陣列鍵',
},
    },
    // header-increment.ts
    'header-increment': {
      'name': '標題遞增',
      'description': '標題層級一次只能遞增一級',
      'start-at-h2': {
        'name': '從標題層級 2 開始標題遞增',
        'description': '將標題層級 2 設為檔案中標題遞增的最低標題層級，並相應地移動所有標題，使其從層級 2 標題開始遞增。',
      },
    },
    // heading-blank-lines.ts
    'heading-blank-lines': {
      'name': '標題空白行',
      'description': '所有標題前後都有一個空白行（除非標題在文件的開頭或結尾）。',
      'bottom': {
        'name': '底部',
        'description': '確保標題後有一個空白行（停用此功能後，不會刪除標題後的空白行）',
      },
      'empty-line-after-yaml': {
        'name': 'YAML 和標題之間的空白行',
        'description': '保留 YAML frontmatter 和標題之間的空白行',
      },
    },
    // headings-start-line.ts
    'headings-start-line': {
      'name': '標題起始行',
      'description': '不以行開頭的標題將移除其前面的空白，以確保它們被辨識為標題。',
    },
    // insert-yaml-attributes.ts
    'insert-yaml-attributes': {
      'name': '插入 YAML 屬性',
      'description': '筆記缺少這些鍵時，把指定屬性插入到 YAML frontmatter，並依所選屬性類型產生對應的值',
      'text-to-insert': {
        'name': '要插入的鍵',
        'description': '要插入到 YAML frontmatter 中的鍵',
        'empty-state': '尚無要插入的鍵。',
        'placeholder-text': '要插入的 YAML',
      },
      'key': {
        'name': '屬性鍵名',
        'placeholder': '鍵名',
      },
      'property-type': {
        'name': '屬性類型',
        'reserved': 'aliases、tags、cssclasses 的類型由 Obsidian 固定為清單，這裡不可更改，也不會寫入 types.json。',
        'fixed-suffix': '（Obsidian 固定）',
      },
      'property-types': {
        'text': '文字',
        'list': '清單',
        'number': '數字',
        'checkbox': '核取方塊',
        'date': '日期',
        'datetime': '日期時間',
      },
      'value': {
        'name': '值（可留空）',
        'description': '留空則插入 {YAML}。',
        'list-hint': '清單項目之間以逗號分隔。',
      },
    },
    // line-break-at-document-end.ts
    'line-break-at-document-end': {
      'name': '文件結尾換行',
      'description': '確保如果筆記不為空，則在文件結尾處只有一個換行符。',
    },
    // move-footnotes-to-the-bottom.ts
    'move-footnotes-to-the-bottom': {
      'name': '將註腳移至底部',
      'description': '將所有註腳移至文件底部，並確保它們根據在檔案內文中參考的順序進行排序。',
          'include-blank-line-between-footnotes': {            'name': '腳註之間保留空行',
  'description': '啟用後，腳註之間會保留一個空行。',
},
},
    // move-math-block-indicators-to-their-own-line.ts
    'move-math-block-indicators-to-their-own-line': {
      'name': '將數學區塊指示符移至其自己的行',
      'description': '使用 <code>表示數學區塊的錢字號數量</code> 來決定多少個錢字號表示單行數學的數學區塊，將所有起始和結束的數學區塊指示符移至其自己的行。',
    },
    // move-tags-to-yaml.ts
    'move-tags-to-yaml': {
      'name': '將標籤移至 YAML',
      'description': '將所有標籤移至文件的 YAML frontmatter。',
      'how-to-handle-existing-tags': {
        'name': '內文標籤操作',
        'description': '將檔案內文中的非忽略標籤移至 frontmatter 後如何處理',
      },
      'tags-to-ignore': {
        'name': '要忽略的標籤',
        'description': '如果啟用 <code>從內容內文中移除標籤的井字號</code>，則不會移至標籤陣列或從內文內容中移除的標籤。每個標籤應在新的一行，且不含 <code>#</code>。<b>請確保標籤名稱中不包含井字號。</b>',
              'empty-state': '尚無要忽略的標籤。',
  'placeholder-text': '要忽略的標籤',
},
    },
    // no-bare-urls.ts
    'no-bare-urls': {
      'name': '無裸 URL',
      'description': '用角括號括住裸 URL，除非它們被反引號、方括號或單引號或雙引號括住。',
      'no-bare-uris': {
        'name': '無裸 URI',
        'description': '嘗試用角括號括住裸 URI，除非它們被反引號、方括號或單引號或雙引號括住。',
      },
    },
    // ordered-list-style.ts
    'ordered-list-style': {
      'name': '有序清單樣式',
      'description': '確保有序清單遵循指定的樣式。<b>注意：2 個空格或 1 個定位點被視為一個縮排層級。</b>',
      'number-style': {
        'name': '數字樣式',
        'description': '有序清單指示符中使用的數字樣式',
      },
      'list-end-style': {
        'name': '有序清單指示符結束樣式',
        'description': '有序清單指示符的結束字元',
      },
      'preserve-start': {
        'name': '保留起始編號',
        'description': '是否保留有序清單的起始編號。這可用於在有序清單項目之間有內容的有序清單。',
      },
    },
    // paragraph-blank-lines.ts
    'paragraph-blank-lines': {
      'name': '段落空白行',
      'description': '所有段落前後都應只有一個空白行。',
    },
    // prevent-double-checklist-indicator-on-paste.ts
    'prevent-double-checklist-indicator-on-paste': {
      'name': '貼上時防止雙重清單指示符',
      'description': '如果檔案中游標所在的行有清單指示符，則從要貼上的文字中移除起始清單指示符',
    },
    // prevent-double-list-item-indicator-on-paste.ts
    'prevent-double-list-item-indicator-on-paste': {
      'name': '貼上時防止雙重清單項目指示符',
      'description': '如果檔案中游標所在的行有清單項目指示符，則從要貼上的文字中移除起始清單項目指示符',
    },
    // proper-ellipsis-on-paste.ts
    'proper-ellipsis-on-paste': {
      'name': '貼上時使用正確的刪節號',
      'description': '將三個連續的點取代為一個刪節號，即使它們在要貼上的文字中有空格',
    },
    // proper-ellipsis.ts
    'proper-ellipsis': {
      'name': '正確的刪節號',
      'description': '將三個連續的點取代為一個刪節號。',
    },
    // quote-style.ts
    'quote-style': {
      'name': '引號樣式',
      'description': '將內文內容中的引號更新為指定的單引號和雙引號樣式。',
      'single-quote-enabled': {
        'name': '啟用 單引號樣式',
        'description': '指定應使用選定的單引號樣式。',
      },
      'single-quote-style': {
        'name': '單引號樣式',
        'description': '要使用的單引號樣式。',
      },
      'double-quote-enabled': {
        'name': '啟用 雙引號樣式',
        'description': '指定應使用選定的雙引號樣式。',
      },
      'double-quote-style': {
        'name': '雙引號樣式',
        'description': '要使用的雙引號樣式。',
      },
    },
    // re-index-footnotes.ts
    're-index-footnotes': {
      'name': '重新索引註腳',
      'description': '根據出現順序重新索引註腳鍵和註腳。<b>注意：如果一個鍵有多個註腳，此規則將不起作用。</b>',
    },
    // remove-consecutive-list-markers.ts
    'remove-consecutive-list-markers': {
      'name': '移除連續清單標記',
      'description': '移除連續的清單標記。在複製貼上清單項目時很有用。',
    },
    // remove-empty-lines-between-list-markers-and-checklists.ts
    'remove-empty-lines-between-list-markers-and-checklists': {
      'name': '移除清單標記和待辦事項清單之間的空白行',
      'description': '清單標記和待辦事項清單之間不應有任何空白行。',
    },
    // remove-empty-list-markers.ts
    'remove-empty-list-markers': {
      'name': '移除空清單標記',
      'description': '移除空的清單標記，即沒有內容的清單項目。',
    },
    // empty-line-around-horizontal-rules.ts
    'empty-line-around-horizontal-rules': {
      'name': '水平線周圍的空白行',
      'description': '確保水平線周圍有空白行，除非它們在文件的開頭或結尾。',
    },
    // remove-hyphenated-line-breaks.ts
    'remove-hyphenated-line-breaks': {
      'name': '移除連字號換行',
      'description': '移除連字號換行。在從教科書貼上文字時很有用。',
    },
    // remove-hyphens-on-paste.ts
    'remove-hyphens-on-paste': {
      'name': '貼上時移除連字號',
      'description': '從要貼上的文字中移除連字號',
    },
    // remove-leading-or-trailing-whitespace-on-paste.ts
    'remove-leading-or-trailing-whitespace-on-paste': {
      'name': '貼上時移除前導或尾隨空白',
      'description': '移除要貼上文字的任何前導非定位點空白和所有尾隨空白',
    },
    // remove-leftover-footnotes-from-quote-on-paste.ts
    'remove-leftover-footnotes-from-quote-on-paste': {
      'name': '貼上時從引文中移除剩餘的註腳',
      'description': '移除要貼上文字的任何剩餘註腳參考',
    },
    // remove-link-spacing.ts
    'remove-link-spacing': {
      'name': '移除連結間距',
      'description': '移除連結文字周圍的間距。',
    },
    // remove-multiple-blank-lines-on-paste.ts
    'remove-multiple-blank-lines-on-paste': {
      'name': '貼上時移除多個空白行',
      'description': '將多個空白行壓縮為一個空白行，用於要貼上的文字',
    },
    // remove-multiple-spaces.ts
    'remove-multiple-spaces': {
      'name': '移除多個空格',
      'description': '移除兩個或多個連續的空格。忽略行首和行尾的空格。',
    },
    // remove-space-around-characters.ts
    'remove-space-around-characters': {
      'name': '移除字元周圍的空格',
      'description': '確保某些字元不被空白（單個空格或定位點）包圍。<b>注意：在某些情況下，這可能會導致 Markdown 格式出現問題。</b>',
      'include-fullwidth-forms': {
        'name': '包含全形字元',
        'description': '包含 <a href="https://en.wikipedia.org/wiki/Halfwidth_and_Fullwidth_Forms_(Unicode_block)">全形字元 Unicode 區塊</a>',
      },
      'include-cjk-symbols-and-punctuation': {
        'name': '包含中日韓符號和標點符號',
        'description': '包含 <a href="https://en.wikipedia.org/wiki/CJK_Symbols_and_Punctuation">中日韓符號和標點符號 Unicode 區塊</a>',
      },
      'include-dashes': {
        'name': '包含破折號',
        'description': '包含 en dash (–) 和 em dash (—)',
      },
      'other-symbols': {
        'name': '其他符號',
        'description': '要包含的其他符號',
      },
    },
    // remove-space-before-or-after-characters.ts
    'remove-space-before-or-after-characters': {
      'name': '移除字元之前或之後的空格',
      'description': '移除指定字元之前的空格和指定字元之後的空格。<b>注意：在某些情況下，這可能會導致 Markdown 格式出現問題。</b>',
      'characters-to-remove-space-before': {
        'name': '移除字元之前的空格',
        'description': '移除指定字元之前的空格。<b>注意：在字元清單中使用 <code>{</code> 或 <code>}</code> 會意外地影響檔案，因為它在幕後用於忽略語法。</b>',
      },
      'characters-to-remove-space-after': {
        'name': '移除字元之後的空格',
        'description': '移除指定字元之後的空格。<b>注意：在字元清單中使用 <code>{</code> 或 <code>}</code> 會意外地影響檔案，因為它在幕後用於忽略語法。</b>',
      },
    },
    // remove-trailing-punctuation-in-heading.ts
    'remove-trailing-punctuation-in-heading': {
      'name': '移除標題中的尾隨標點符號',
      'description': '從標題結尾移除指定的標點符號，確保忽略 <a href="https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references">HTML 實體參考</a> 結尾的分號。',
      'punctuation-to-remove': {
        'name': '尾隨標點符號',
        'description': '要從檔案標題中移除的尾隨標點符號。',
      },
    },
    // remove-yaml-keys.ts
    'remove-yaml-keys': {
      'name': '移除 YAML 鍵',
      'description': '移除指定的 YAML 鍵',
      'yaml-keys-to-remove': {
        'name': '要移除的 YAML 鍵',
        'description': '要從 YAML frontmatter 中移除的 YAML 鍵，帶或不帶冒號',
              'empty-state': '尚無要移除的 YAML 鍵。',
  'placeholder-text': '要移除的 YAML 鍵',
},
    },
    // sort-yaml-array-values.ts
    'sort-yaml-array-values': {
      'name': '排序 YAML 陣列值',
      'description': '根據指定的排序順序對 YAML 陣列值進行排序。',
      'sort-alias-key': {
        'name': '排序 YAML 別名區段',
        'description': '開啟別名排序功能。',
      },
      'sort-tag-key': {
        'name': '排序 YAML 標籤區段',
        'description': '開啟標籤排序功能。',
      },
      'sort-array-keys': {
        'name': '排序 YAML 陣列區段',
        'description': '開啟對一般 YAML 陣列的值進行排序的功能',
      },
      'ignore-keys': {
        'name': '若要忽略的 YAML 鍵，以便對 YAML 陣列值進行排序',
        'description': '一個 YAML 鍵的清單，每行一個，不含結尾的冒號，這些鍵的值不應進行排序。',
              'empty-state': '尚無要忽略的 YAML 鍵。',
  'placeholder-text': '要忽略的 YAML 鍵',
},
      'sort-order': {
        'name': '排序順序',
        'description': '對 YAML 陣列值進行排序的方式。',
      },
    },
    // space-after-list-markers.ts
    'space-after-list-markers': {
      'name': '清單標記後的空格',
      'description': '清單標記和核取方塊後應有一個單一空格。',
    },
    // space-between-chinese-japanese-or-korean-and-english-or-numbers.ts
    'space-between-chinese-japanese-or-korean-and-english-or-numbers': {
      'name': '中日韓文與英文或數字之間的空格',
      'description': '確保中日韓文與英文或數字之間以單一空格分隔。遵循這些 <a href="https://github.com/sparanoid/chinese-copywriting-guidelines">指南</a>',
      'english-symbols-punctuation-before': {
        'name': '中日韓文前的英文標點符號和符號',
        'description': '在中日韓字元前發現時，要視為英文的非字母標點符號和符號清單。<b>注意：「*」始終被視為英文，對於正確處理某些 Markdown 語法是必要的。</b>',
      },
      'english-symbols-punctuation-after': {
        'name': '中日韓文後的英文標點符號和符號',
        'description': '在中日韓字元後發現時，要視為英文的非字母標點符號和符號清單。<b>注意：「*」始終被視為英文，對於正確處理某些 Markdown 語法是必要的。</b>',
      },
    },
    // strong-style.ts
    'strong-style': {
      'name': '粗體樣式',
      'description': '確保粗體樣式一致。',
      'style': {
        'name': '樣式',
        'description': '用於表示粗體/加粗內容的樣式',
      },
    },
    // trailing-spaces.ts
    'trailing-spaces': {
      'name': '尾隨空格',
      'description': '移除每行之後的多餘空格。',
      'two-space-line-break': {
        'name': '雙空格換行',
        'description': '忽略後跟換行符的兩個空格（「雙空格規則」）。',
      },
    },
    // two-spaces-between-lines-with-content.ts
    'two-spaces-between-lines-with-content': {
      'name': '有內容的行之間的換行',
      'description': '確保將指定的換行符新增到段落、區塊引言和清單項目中，內容在下一行繼續的行的結尾',
      'line-break-indicator': {
        'name': '換行指示符',
        'description': '要使用的換行指示符。',
      },
    },
    // unordered-list-style.ts
    'unordered-list-style': {
      'name': '無序清單樣式',
      'description': '確保無序清單遵循指定的樣式。',
      'list-style': {
        'name': '清單項目樣式',
        'description': '在無序清單中使用的清單項目樣式',
      },
    },
    // yaml-key-sort.ts
    'yaml-key-sort': {
      'name': 'YAML 鍵排序',
      'description': '根據指定的順序和優先級對 YAML 鍵進行排序。<b>注意：也可能移除空白行。僅適用於非巢狀鍵。</b>',
      'inherit-priority-keys': '把「要插入的鍵」按順序併入本清單，你自己新增的鍵保留在後面',
      'inherit-priority-keys-label': '繼承「要插入的鍵」',
      'yaml-key-priority-sort-order': {
        'name': 'YAML 鍵優先級排序順序',
        'description': '對每行一個的鍵進行排序的順序，它會按照清單中找到的順序進行排序',
              'empty-state': '尚無 YAML 鍵排序順序。',
  'placeholder-text': '優先排序的 YAML 鍵',
},
      'priority-keys-at-start-of-yaml': {
        'name': 'YAML 開頭的優先級鍵',
        'description': 'YAML 鍵優先級排序順序放置在 YAML frontmatter 的開頭',
              'empty-state': '尚無優先鍵排序順序。',
  'placeholder-text': '優先排序的 YAML 鍵',
},
      'yaml-sort-order-for-other-keys': {
        'name': '其他鍵的 YAML 排序順序',
        'description': '對在 YAML 鍵優先級排序順序文字區域中找不到的鍵進行排序的方式',
      },
    },
    // yaml-timestamp.ts
    'yaml-timestamp': {
      'name': 'YAML 時間戳記',
      'description': '在 YAML front matter 中追蹤檔案上次編輯的日期。從檔案元資料中取得日期。',
      'date-created': {
        'name': '建立日期',
        'description': '插入檔案建立日期',
      },
      'date-created-key': {
        'name': '建立日期鍵',
        'description': '用於建立日期的 YAML 鍵',
      },
      'date-created-source-of-truth': {
        'name': '建立日期來源',
        'description': '指定如果 frontmatter 中已存在建立日期，則從何處取得建立日期值。',
      },
      'date-modified-source-of-truth': {
        'name': '修改日期來源',
        'description': '指定如果 frontmatter 中已存在修改日期，則應使用何種方式來決定何時應更新修改日期。',
      },
      'date-modified': {
        'name': '修改日期',
        'description': '插入檔案上次修改的日期',
      },
      'date-modified-key': {
        'name': '修改日期鍵',
        'description': '用於修改日期的 YAML 鍵',
      },
      'format': {
        'name': '格式',
        'description': '要使用的 Moment 日期格式（請參閱 <a href="https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/">Moment 格式選項</a>）',
      },
      'convert-to-utc': {
        'name': '將本地時間轉換為 UTC',
        'description': '使用 UTC 對等值來儲存日期，而非本地時間',
      },
      'update-on-file-contents-updated': {
        'name': '檔案內容更新時更新 YAML 時間戳記',
        'description': '當目前活動的筆記被修改時，會在筆記上執行 <code>YAML 時間戳記</code>。如果修改後的筆記時間戳記與目前值相差超過 5 秒，則應更新該時間戳記。',
      },
    },
    // yaml-title-alias.ts
    'yaml-title-alias': {
      'name': 'YAML 標題別名',
      'description': '將檔案的標題插入或更新到 YAML frontmatter 的別名區段。從第一個 H1 或檔名取得標題。',
      'preserve-existing-alias-section-style': {
        'name': '保留現有的別名區段樣式',
        'description': '如果設定，<code>YAML 別名區段樣式</code> 設定僅適用於新建立的區段',
      },
      'keep-alias-that-matches-the-filename': {
        'name': '保留與檔名相符的別名',
        'description': '此類別名通常是多餘的',
      },
      'use-yaml-key-to-keep-track-of-old-filename-or-heading': {
        'name': '使用由 別名輔助鍵 指定的 YAML 鍵來協助處理檔名和標題變更',
        'description': '如果設定，當第一個 H1 標題變更或如果第一個 H1 不存在時檔名變更，則儲存在此鍵中的舊別名將被新值取代，而不是僅在別名陣列中插入新項目',
      },
      'alias-helper-key': {
        'name': '別名輔助鍵',
        'description': '用於協助追蹤此規則儲存在 Frontmatter 中的最後一個檔名或標題的鍵。',
      },
          'remove-alias-if-empty': {            'name': '別名為空時移除',
  'description': '當檔案的別名鍵最終為空時，移除該別名鍵。',
},
},
    // yaml-title.ts
    'yaml-title': {
      'name': 'YAML 標題',
      'description': '將檔案的標題插入到 YAML Frontmatter 中。根據所選模式取得標題。',
      'title-key': {
        'name': '標題鍵',
        'description': '用於標題的 YAML 鍵',
      },
      'mode': {
        'name': '模式',
        'description': '用於取得標題的方法',
      },
    },
      // align-table-columns.ts
    'align-table-columns': {
      'name': '表格欄對齊',
      'description': '對齊表格，使所有欄具有相同的長度。',
    },

    // move-inline-fields-to-yaml.ts
    'move-inline-fields-to-yaml': {
      'name': '將行內欄位移入 YAML',
      'description': '將 Dataview 行內欄位（<code>key:: value</code>）移動到文件的 frontmatter。清單項與任務上的欄位保持原樣，因為 Dataview 將其作用於清單項。標籤與別名欄位使用一般設定中的標籤/別名陣列樣式，其他有多個值的鍵使用一般設定中的預設 YAML 陣列樣式。',
      'how-to-handle-full-line-fields': {
        'name': '整行行內欄位',
        'description': '如何處理獨占一行的行內欄位，如 <code>key:: value</code>',
      },
      'how-to-handle-bracketed-fields': {
        'name': '括號包裹的行內欄位',
        'description': '如何處理被方括號或圓括號包裹的行內欄位，如 <code>[key:: value]</code> 和 <code>(key:: value)</code>',
      },
      'how-to-handle-existing-keys': {
        'name': '鍵已存在時',
        'description': '行內欄位與 frontmatter 中已有鍵同名時如何處理。鍵必須完全一致（區分大小寫）。',
      },
      'inline-keys-to-ignore': {
        'name': '要忽略的行內鍵',
        'description': '不會移動到 frontmatter 的行內欄位鍵',
        'empty-state': '尚無要忽略的行內鍵。',
        'placeholder-text': '要忽略的行內鍵',
      },
    },

},

  // These are the string values in the UI for enum values and thus they do not follow the key format as used above
  'enums': {
    'Title Case': '標題大小寫',
    'ALL CAPS': '全大寫',
    'First letter': '首字母',
    '.': '.', // 保持不變
    ')': ')', // 保持不變
    'ERROR': '錯誤',
    'TRACE': '追蹤',
    'DEBUG': '偵錯',
    'INFO': '資訊',
    'WARN': '警告',
    'SILENT': '靜默',
    'ascending': '升序',
    'lazy': 'lazy',
    'preserve': '保留',
    'Nothing': '無',
    'Remove hashtag': '移除井字號',
    'Remove whole tag': '移除整個標籤',
    'asterisk': '星號',
    'underscore': '底線',
    'consistent': '一致',
    '-': '-', // 保持不變
    '*': '*', // 保持不變
    '+': '+', // 保持不變
    'space': '空格',
    'no space': '無空格',
    'None': '無',
    'Ascending Alphabetical': '字母升冪排列',
    'Descending Alphabetical': '字母降冪排列',
    // yaml.ts
    'multi-line': '多行',
    'single-line': '單行',
    'single string to single-line': '單一字串轉單行',
    'single string to multi-line': '單一字串轉多行',
    'single string comma delimited': '單一字串逗號分隔',
    'single string space delimited': '單一字串空格分隔',
    'single-line space delimited': '單行空格分隔',
    // yaml-title.ts
    'first-h1': '第一個 H1',
    'first-h1-or-filename-if-h1-missing': '第一個 H1 或如果 H1 遺失則為檔名',
    'filename': '檔名',
    // settings-data.ts
    'never': '永不',
    'after 5 seconds': '5 秒後',
    'after 10 seconds': '10 秒後',
    'after 15 seconds': '15 秒後',
    'after 30 seconds': '30 秒後',
    'after 1 minute': '1 分鐘後',
    // yaml-timestamp.ts
    'file system': '檔案系統',
    'frontmatter': 'YAML frontmatter',
    'user or Linter edits': '在 Obsidian 中的變更',
    // quote-style.ts
    '\'\'': '\'\'', // 保持不變
    '‘’': '‘’', // 保持不變
    '""': '""', // 保持不變
    '“”': '“”', // 保持不變
    // yaml.ts
    '\\': '\\', // 保持不變
    '<br>': '<br>', // 保持不變
    '  ': '  ', // 保持不變
    '<br/>': '<br/>', // 保持不變
      'Leave in place': '保留在原處',
  'Merge into list': '合併為清單',
  'Move and keep in text': '移動並保留在內文',
  'Move and keep value in text': '移動並在內文保留值',
  'Move and remove': '移動並移除',
  'Overwrite': '覆寫',
  'Skip': '跳過',
},
  'add-tooltip': '新增',
  'already-in-list': '已在清單中',
  'edit-tooltip': '編輯',
  'required': '必填',
  'validation': {    'invalid-tag': '「{TAG}」不是有效的 Obsidian 標籤',
  'invalid-yaml': '「{YAML}」不是有效的 YAML',
  'invalid-yaml-key': '「{KEY}」不是有效的 YAML 鍵：{ERROR_MESSAGE}',
  'no-hashtag-in-tag': '「{TAG}」不能以 # 開頭',
  'no-whitespace': '「{TEXT}」不能包含任何空白',
  'yaml-key-no-colon': '「{KEY}」應只包含 YAML 鍵本身，不帶冒號',
  'yaml-key-no-whitespace': '「{KEY}」不應包含首尾空白',
  'yaml-key-only': '「{KEY}」應只包含 YAML 鍵（可帶冒號）',
  // rules/insert-yaml-attributes.ts
  'invalid-property-key': '「{KEY}」不是有效的屬性鍵名',
  'invalid-number': '「{VALUE}」不是數字',
  'invalid-checkbox': '「{VALUE}」必須是 true 或 false',
  'invalid-date': '「{VALUE}」不是 YYYY-MM-DD 形式的日期',
  'invalid-datetime': '「{VALUE}」不是 YYYY-MM-DDTHH:mm 形式的日期時間',
},
};
