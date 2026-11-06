/**
 * [상수 설정] 
 * 코드 수정 및 동작 환경을 제어하는 제어판입니다.
 */
const MARGIN_C = 2.5;                // 옷 추가 시 자동 적용되는 기온 여유값 (℃)
const MAX_CANDIDATES = 15;           // AI에 전달할 최대 상/하의 후보 수
const AI_DAILY_LIMIT = 20;           // 하루 최대 AI 호출 제한 횟수
const AI_TIMEOUT_MS = 15000;         // AI 호출 타임아웃 시간 (15초)
const DEFAULT_LAT = 37.57;           // 서울 위도 (스크립트 속성 미설정 시 기본값)
const DEFAULT_LON = 126.98;          // 서울 경도 (스크립트 속성 미설정 시 기본값)

// Gemini AI API 관련 상수
const AI_MODEL = "gemini-2.5-flash"; // AI Studio에서 지원하는 모델명
// 주석: AI Studio에서 현재 무료로 쓸 수 있는 모델인지 확인하고, 아니면 바꾸세요.
const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`;

/**
 * 웹앱으로 접속했을 때 index.html을 출력합니다.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('기상 정보와 옷 추천 대시보드')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

/**
 * 시트가 초기화되어 있지 않을 때 기본 시트 구조와 드롭다운, 더미 데이터를 생성합니다.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. '기록' 시트 확인 및 생성
  let recordSheet = ss.getSheetByName('기록');
  if (!recordSheet) {
    recordSheet = ss.insertSheet('기록');
    recordSheet.appendRow([
      '날짜', '일정 제목', '스타일', '최저 기온(℃)', '최고 기온(℃)', 
      '기상 상태', '추천 상의', '추천 하의', '추천 아우터', '추천 추가 아이템'
    ]);
    
    // 스타일 드롭다운 설정
    const styleRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['스포티', '포멀', '편하게', '캐주얼', '단정'], true)
      .build();
    recordSheet.getRange('C2:C1000').setDataValidation(styleRule);

    // 기상 상태 드롭다운 설정
    const weatherRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['맑음', '구름', '비', '눈', '안개', '뇌우'], true)
      .build();
    recordSheet.getRange('F2:F1000').setDataValidation(weatherRule);
  }

  // 2. '옷장' 시트 확인 및 생성
  let closetSheet = ss.getSheetByName('옷장');
  if (!closetSheet) {
    closetSheet = ss.insertSheet('옷장');
    closetSheet.appendRow([
      '옷 별칭', '종류', '스타일', '적정 최저 기온(℃)', '적정 최고 기온(℃)', 
      '비·눈 올 때 입기', '사용 여부'
    ]);

    // 드롭다운 설정
    const typeRule = SpreadsheetApp.newDataValidation().requireValueInList(['상의', '하의', '아우터'], true).build();
    const styleRule = SpreadsheetApp.newDataValidation().requireValueInList(['스포티', '포멀', '편하게', '캐주얼', '단정'], true).build();
    const rainRule = SpreadsheetApp.newDataValidation().requireValueInList(['가능', '불가'], true).build();
    const useRule = SpreadsheetApp.newDataValidation().requireValueInList(['사용', '제외'], true).build();

    closetSheet.getRange('B2:B1000').setDataValidation(typeRule);
    closetSheet.getRange('C2:C1000').setDataValidation(styleRule);
    closetSheet.getRange('F2:F1000').setDataValidation(rainRule);
    closetSheet.getRange('G2:G1000').setDataValidation(useRule);
  }

  // 3. 더미 데이터 삽입 (시트가 비어있는 경우에만 26벌 등록)
  if (closetSheet.getLastRow() === 1) {
    const dummyData = [
      // 상의 (10벌)
      ['흰 반팔티', '상의', '편하게', 20, 35, '가능', '사용'],
      ['줄무늬 긴팔티', '상의', '캐주얼', 10, 22, '가능', '사용'],
      ['회색 후드티', '상의', '스포티', 5, 18, '불가', '사용'],
      ['흰 셔츠', '상의', '포멀', 12, 28, '가능', '사용'],
      ['베이지 니트', '상의', '단정', 0, 15, '불가', '사용'],
      ['기모 맨투맨', '상의', '편하게', -15, 10, '가능', '사용'],
      ['스포츠 반팔', '상의', '스포티', 18, 38, '가능', '사용'],
      ['실크 블라우스', '상의', '포멀', 15, 26, '불가', '사용'],
      ['쉬폰 블라우스', '상의', '단정', 18, 28, '가능', '사용'],
      ['터틀넥 기모티', '상의', '단정', -15, 8, '가능', '사용'],

      // 하의 (9벌)
      ['청바지', '하의', '캐주얼', -5, 25, '가능', '사용'],
      ['검정 슬랙스', '하의', '포멀', -5, 28, '가능', '사용'],
      ['트레이닝 팬츠', '하의', '스포티', -5, 25, '가능', '사용'],
      ['면 반바지', '하의', '편하게', 18, 38, '가능', '사용'],
      ['베이지 치노팬츠', '하의', '단정', 5, 26, '가능', '사용'],
      ['기모 조거팬츠', '하의', '편하게', -15, 10, '가능', '사용'],
      ['린넨 롱스커트', '하의', '단정', 20, 35, '가능', '사용'],
      ['방수 스포티 팬츠', '하의', '스포티', -10, 25, '가능', '사용'],
      ['모직 슬랙스', '하의', '포멀', -15, 8, '가능', '사용'],

      // 아우터 (7벌)
      ['얇은 가디건', '아우터', '단정', 12, 22, '불가', '사용'],
      ['바람막이', '아우터', '스포티', 8, 22, '가능', '사용'],
      ['롱패딩', '아우터', '편하게', -20, 5, '가능', '사용'],
      ['울 코트', '아우터', '포멀', -10, 10, '불가', '사용'],
      ['가죽자켓', '아우터', '캐주얼', 8, 18, '불가', '사용'],
      ['경량 패딩', '아우터', '편하게', -5, 12, '가능', '사용'],
      ['트렌치 코트', '아우터', '포멀', 8, 18, '가능', '사용']
    ];
    closetSheet.getRange(2, 1, dummyData.length, 7).setValues(dummyData);
  }
}

/**
 * 특정 날짜(YYYY-MM-DD)의 Open-Meteo API 날씨 정보를 가져오거나 캐시를 활용합니다.
 */
function getWeatherInfo(targetDateStr) {
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const reqDate = targetDateStr || todayStr;

  const cache = CacheService.getScriptCache();
  const cachedWeather = cache.get(`WEATHER_${reqDate}`);

  if (cachedWeather) {
    return JSON.parse(cachedWeather);
  }

  const props = PropertiesService.getScriptProperties();
  const lat = props.getProperty('LAT') || DEFAULT_LAT;
  const lon = props.getProperty('LON') || DEFAULT_LON;

  // past_days=7, forecast_days=7 로 과거/미래 7일간 예보 범위 지원
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&past_days=7&forecast_days=7&timezone=auto`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      throw new Error("HTTP error " + response.getResponseCode());
    }
    const data = JSON.parse(response.getContentText());
    const dates = data.daily.time;
    let idx = dates.indexOf(reqDate);
    
    // 만약 범위를 벗어나 찾을 수 없는 경우 오늘 날짜(또는 0번 인덱스) 사용
    if (idx === -1) {
      idx = dates.indexOf(todayStr);
      if (idx === -1) idx = 0;
    }

    const minTemp = Math.round(data.daily.temperature_2m_min[idx]);
    const maxTemp = Math.round(data.daily.temperature_2m_max[idx]);
    const rawCode = data.daily.weathercode[idx];
    const condition = parseWmoCode(rawCode);

    const weatherData = {
      success: true,
      minTemp: minTemp,
      maxTemp: maxTemp,
      condition: condition,
      date: reqDate
    };

    cache.put(`WEATHER_${reqDate}`, JSON.stringify(weatherData), 21600);
    return weatherData;
  } catch (e) {
    return {
      success: false,
      message: "날씨를 불러오지 못했어요",
      minTemp: 15,
      maxTemp: 23,
      condition: "구름",
      date: reqDate
    };
  }
}

/**
 * Open-Meteo WMO 날씨 코드를 6가지 상태 중 하나로 변환합니다.
 */
function parseWmoCode(code) {
  if (code === 0) return '맑음';
  if ([1, 2, 3].includes(code)) return '구름';
  if ([45, 48].includes(code)) return '안개';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '비';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '눈';
  if ([95, 96, 99].includes(code)) return '뇌우';
  return '구름';
}

/**
 * 옷장 시트에 신규 옷을 추가합니다.
 */
function addClothes(data) {
  setupSheet();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('옷장');
  
  const name = String(data.name || '').trim();
  const type = data.type;
  const style = data.style;
  const minTempInput = parseFloat(data.minTemp);
  const maxTempInput = parseFloat(data.maxTemp);
  const rainable = data.rainable;

  if (!name) return { success: false, message: "옷 별칭을 입력해 주세요." };
  if (!type) return { success: false, message: "종류를 선택해 주세요." };
  if (!style) return { success: false, message: "스타일을 선택해 주세요." };
  if (isNaN(minTempInput) || isNaN(maxTempInput)) return { success: false, message: "적정 기온을 숫자로 입력해 주세요." };
  if (minTempInput > maxTempInput) return { success: false, message: "최저 기온이 최고 기온보다 높을 수 없어요." };
  if (!rainable) return { success: false, message: "비·눈 올 때 입기 여부를 선택해 주세요." };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === name) {
      return { success: false, message: "이미 있는 옷이에요" };
    }
  }

  const savedMin = minTempInput - MARGIN_C;
  const savedMax = maxTempInput + MARGIN_C;

  sheet.appendRow([name, type, style, savedMin, savedMax, rainable, '사용']);

  return {
    success: true,
    message: `저장했어요. 입력한 범위 ${minTempInput}~${maxTempInput}℃ → 저장된 적정 범위 ${savedMin}~${savedMax}℃`,
    closetList: getClosetList()
  };
}

/**
 * 옷장 목록을 조회하여 반환합니다.
 */
function getClosetList() {
  setupSheet();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('옷장');
  const rows = sheet.getDataRange().getValues();
  
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    list.push({
      name: rows[i][0],
      type: rows[i][1],
      style: rows[i][2],
      minTemp: rows[i][3],
      maxTemp: rows[i][4],
      rainable: rows[i][5],
      use: rows[i][6]
    });
  }
  return list;
}

/**
 * 오늘 기록을 작성하고 지정된 날짜의 날씨 기반으로 옷 추천 결과를 생성 및 저장합니다.
 */
function saveTodayRecord(inputData) {
  setupSheet();
  const title = String(inputData.title || '').trim();
  const style = inputData.style;
  const dateStr = inputData.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  if (!title) return { success: false, message: "일정 제목을 적어주세요." };
  if (!style) return { success: false, message: "스타일을 선택해 주세요." };

  // 입력받은 날짜(dateStr) 기준 날씨 호출
  const weather = getWeatherInfo(dateStr);
  const recommendation = getRecommendation(weather, title, style, dateStr);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('기록');
  
  sheet.appendRow([
    dateStr,
    title,
    style,
    weather.minTemp,
    weather.maxTemp,
    weather.condition,
    recommendation.top,
    recommendation.bottom,
    "", 
    ""  
  ]);

  return {
    success: true,
    recommendation: recommendation,
    weather: weather
  };
}

/**
 * [추천 로직]
 */
function getRecommendation(weather, title, style, dateStr) {
  const closet = getClosetList();
  const avgTemp = (weather.minTemp + weather.maxTemp) / 2;
  const isBadWeather = (weather.condition === '비' || weather.condition === '눈');

  const availableClothes = closet.filter(item => {
    if (item.use !== '사용') return false;
    if (item.style !== style) return false;
    if (isBadWeather && item.rainable === '불가') return false;
    if (avgTemp < item.minTemp || avgTemp > item.maxTemp) return false;
    return true;
  });

  const tops = availableClothes.filter(item => item.type === '상의').slice(0, MAX_CANDIDATES);
  const bottoms = availableClothes.filter(item => item.type === '하의').slice(0, MAX_CANDIDATES);

  if (tops.length === 0 || bottoms.length === 0) {
    return {
      top: "맞는 옷 없음",
      bottom: "맞는 옷 없음",
      reason: "조건에 맞는 옷이 옷장에 없어요.",
      method: "기본 추천"
    };
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = `REC_${dateStr}_${style}_${title}`;
  const cachedResult = cache.get(cacheKey);

  if (cachedResult) {
    return JSON.parse(cachedResult);
  }

  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const todayCountKey = `AI_COUNT_${todayStr}`;
  let currentAiCount = parseInt(cache.get(todayCountKey) || "0", 10);

  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GEMINI_API_KEY');

  let result = null;

  if (apiKey && currentAiCount < AI_DAILY_LIMIT) {
    const lastComboKey = `LAST_COMBO_${style}`;
    const lastCombo = cache.get(lastComboKey) || "";

    result = callGeminiApi(apiKey, weather, title, style, tops, bottoms, lastCombo);
    if (result) {
      const topExists = tops.some(t => t.name === result.top);
      const bottomExists = bottoms.some(b => b.name === result.bottom);

      if (topExists && bottomExists) {
        result.method = "AI 추천";
        cache.put(todayCountKey, String(currentAiCount + 1), 86400);
      } else {
        result = null;
      }
    }
  }

  if (!result) {
    const lastComboKey = `LAST_COMBO_${style}`;
    const lastCombo = cache.get(lastComboKey) || "";

    let selectedTop = tops[Math.floor(Math.random() * tops.length)].name;
    let selectedBottom = bottoms[Math.floor(Math.random() * bottoms.length)].name;

    if (tops.length > 1 || bottoms.length > 1) {
      let attempts = 0;
      while (`${selectedTop}+${selectedBottom}` === lastCombo && attempts < 10) {
        selectedTop = tops[Math.floor(Math.random() * tops.length)].name;
        selectedBottom = bottoms[Math.floor(Math.random() * bottoms.length)].name;
        attempts++;
      }
    }

    result = {
      top: selectedTop,
      bottom: selectedBottom,
      reason: "AI를 쓸 수 없어 기본 규칙으로 골랐어요",
      method: "기본 추천"
    };
  }

  cache.put(cacheKey, JSON.stringify(result), 21600);
  cache.put(`LAST_COMBO_${style}`, `${result.top}+${result.bottom}`, 86400);

  return result;
}

/**
 * Gemini REST API 호출
 */
function callGeminiApi(apiKey, weather, title, style, tops, bottoms, lastCombo) {
  const prompt = `
  아래 후보 목록에 있는 옷 별칭만 그대로 골라라. 목록에 없는 옷을 만들어 내지 마라. 일정과 날씨에 어울리고, 색과 분위기가 자연스러운 조합을 골라라. 반드시 JSON만 출력해라: {"상의": "...", "하의": "...", "이유": "한 문장"}

  [정보]
  - 기온: 최저 ${weather.minTemp}℃ / 최고 ${weather.maxTemp}℃
  - 기상 상태: ${weather.condition}
  - 일정: ${title}
  - 스타일: ${style}
  - 상의 후보: ${tops.map(t => t.name).join(', ')}
  - 하의 후보: ${bottoms.map(b => b.name).join(', ')}
  - 직전 추천 조합: ${lastCombo}
  `;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(AI_API_URL, options);
    if (response.getResponseCode() !== 200) return null;

    const resJson = JSON.parse(response.getContentText());
    let rawText = resJson.candidates[0].content.parts[0].text;

    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawText);

    return {
      top: parsed["상의"],
      bottom: parsed["하의"],
      reason: parsed["이유"]
    };
  } catch (e) {
    return null;
  }
}

/**
 * 요약 화면용 최신 추천 결과 및 목록용 데이터 반환
 */
function getDashboardData() {
  setupSheet();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recordSheet = ss.getSheetByName('기록');
  const lastRow = recordSheet.getLastRow();

  let latestRecord = null;
  let targetDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  if (lastRow > 1) {
    const rowValues = recordSheet.getRange(lastRow, 1, 1, 10).getValues()[0];
    targetDate = Utilities.formatDate(new Date(rowValues[0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    latestRecord = {
      date: targetDate,
      title: rowValues[1],
      style: rowValues[2],
      minTemp: rowValues[3],
      maxTemp: rowValues[4],
      condition: rowValues[5],
      top: rowValues[6],
      bottom: rowValues[7]
    };
  }

  // 최신 기록의 날짜 기상 정보 조회
  const weather = getWeatherInfo(targetDate);

  return {
    weather: weather,
    latestRecord: latestRecord,
    closet: getClosetList()
  };
}
