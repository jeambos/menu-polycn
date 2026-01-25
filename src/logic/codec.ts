// src/logic/codec.ts
import questionsData from '../data/questions.json';

// 1. 你的完整 Emoji 字典 (请把文件里的完整数组贴在这里)
const EMOJI_MAP: string[] = [
        '🆘', '🆙', '🆚', '🈁', '🈂', '🈚', '🈯', '🈲', '🈳', '🈴', '🈵',
        '🈶', '🈷', '🈸', '🈹', '🈺', '🉐', '🉑', '🌀', '🌁', '🌂',
        '🌃', '🌄', '🌅', '🌆', '🌇', '🌈', '🌉', '🌊', '🌋', '🌌',
        '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖',
        '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌝', '🌞', '🌟', '🌠',
        '🌡', '🌤', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪', '🌫', '🌬',
        '🌭', '🌮', '🌯', '🌰', '🌱', '🌲', '🌳', '🌴', '🌵', '🌶',
        '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', '🍀',
        '🍁', '🍂', '🍃', '🍄', '🍅', '🍆', '🍇', '🍈', '🍉', '🍊',
        '🍋', '🍌', '🍍', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🍔',
        '🍕', '🍖', '🍗', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍞',
        '🍟', '🍠', '🍡', '🍢', '🍣', '🍤', '🍥', '🍦', '🍧', '🍨',
        '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍰', '🍱', '🍲',
        '🍳', '🍴', '🍵', '🍶', '🍷', '🍸', '🍹', '🍺', '🍻', '🍼',
        '🍽', '🍾', '🍿', '🎀', '🎁', '🎂', '🎃', '🎄', '🎅', '🎆',
        '🎇', '🎈', '🎉', '🎊', '🎋', '🎌', '🎍', '🎎', '🎏', '🎐',
        '🎑', '🎒', '🎓', '🎖', '🎗', '🎙', '🎚', '🎛', '🎞', '🎟',
        '🎠', '🎡', '🎢', '🎣', '🎤', '🎥', '🎦', '🎧', '🎨', '🎩',
        '🎪', '🎫', '🎬', '🎭', '🎮', '🎯', '🎰', '🎱', '🎲', '🎳',
        '🎴', '🎵', '🎶', '🎷', '🎸', '🎹', '🎺', '🎻', '🎼', '🎽',
        '🎾', '🎿', '🏀', '🏁', '🏂', '🏃', '🏄', '🏅', '🏆', '🏇',
        '🏈', '🏉', '🏊', '🏋', '🏌', '🏍', '🏎', '🏏', '🏐', '🏑',
        '🏒', '🏓', '🏔', '🏕', '🏖', '🏗', '🏘', '🏙', '🏚', '🏛',
        '🏜', '🏝', '🏞', '🏟', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
        '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏮', '🏯',
        '🏰', '🏳', '🏴', '🏵', '🏷', '🏸', '🏹', '🏺', '🐀', '🐁',
        '🐂', '🐃', '🐄', '🐅', '🐆', '🐇', '🐈', '🐉', '🐊', '🐋',
        '🐌', '🐍', '🐎', '🐏', '🐐', '🐑', '🐒', '🐓', '🐔', '🐕',
        '🐖', '🐗', '🐘', '🐙', '🐚', '🐛', '🐜', '🐝', '🐞', '🐟',
        '🐠', '🐡', '🐢', '🐣', '🐤', '🐥', '🐦', '🐧', '🐨', '🐩',
        '🐪', '🐫', '🐬', '🐭', '🐮', '🐯', '🐰', '🐱', '🐲', '🐳',
        '🐴', '🐵', '🐶', '🐷', '🐸', '🐹', '🐺', '🐻', '🐼', '🐽',
        '🐾', '🐿', '👀', '👁', '👂', '👃', '👄', '👅', '👆', '👇',
        '👈', '👉', '👊', '👋', '👌', '👍', '👎', '👏', '👐', '👑',
        '👒', '👓', '👔', '👕', '👖', '👗', '👘', '👙', '👚', '👛',
        '👜', '👝', '👞', '👟', '👠', '👡', '👢', '👣', '👤', '👥',
        '👦', '👧', '👨', '👩', '👪', '👫', '👬', '👭', '👮', '👯',
        '👰', '👱', '👲', '👳', '👴', '👵', '👶', '👷', '👸', '👹',
        '👺', '👻', '👼', '👽', '👾', '👿', '💀', '💁', '💂', '💃',
        '💄', '💅', '💆', '💇', '💈', '💉', '💊', '💋', '💌', '💍',
        '💎', '💏', '💐', '💑', '💒', '💓', '💔', '💕', '💖', '💗',
        '💘', '💙', '💚', '💛', '💜', '💝', '💞', '💟', '💠', '💡',
        '💢', '💣', '💤', '💥', '💦', '💧', '💨', '💩', '💪', '💫',
        '💬', '💭', '💮', '💯', '💰', '💱', '💲', '💳', '💴', '💵',
        '💶', '💷', '💸', '💹', '💺', '💻', '💼', '💽', '💾', '💿',
        '📀', '📁', '📂', '📃', '📄', '📅', '📆', '📇', '📈', '📉',
        '📊', '📋', '📌', '📍', '📎', '📏', '📐', '📑', '📒', '📓',
        '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📛', '📜', '📝',
        '📞', '📟', '📠', '📡', '📢', '📣', '📤', '📥', '📦', '📧',
        '📨', '📩', '📪', '📫', '📬', '📭', '📮', '📯', '📰', '📱',
        '📲', '📳', '📴', '📵', '📶', '📷', '📸', '📹', '📺', '📻',
        '📼', '📽', '📿', '🔀', '🔁', '🔂', '🔃', '🔄', '🔅', '🔆',
        '🔇', '🔈', '🔉', '🔊', '🔋', '🔌', '🔍', '🔎', '🔏', '🔐',
        '🔑', '🔒', '🔓', '🔔', '🔕', '🔖', '🔗', '🔘', '🔙', '🔚',
        '🔛', '🔜', '🔝', '🔞', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤',
        '🔥', '🔦', '🔧', '🔨', '🔩', '🔪', '🔫', '🔬', '🔭', '🔮',
        '🔯', '🔰', '🔱', '🔲', '🔳', '🔴', '🔵', '🔶', '🔷', '🔸',
        '🔹', '🔺', '🔻', '🔼', '🔽', '🕉', '🕊', '🕋', '🕌', '🕍',
        '🕎', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘',
        '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢',
        '🕣', '🕤', '🕥', '🕦', '🕧', '🕯', '🕰', '🕳', '🕴', '🕵',
        '🕶', '🕷', '🕸', '🕹', '🕺', '🖇', '🖊', '🖋', '🖌', '🖍',
        '🖐', '🖕', '🖖', '🖤', '🖥', '🖨', '🖱', '🖲', '🖼', '🗂',
        '🗃', '🗄', '🗑', '🗒', '🗓', '🗜', '🗝', '🗞', '🗡', '🗣',
        '🗨', '🗯', '🗳', '🗺', '🗻', '🗼', '🗽', '🗾', '🗿', '😀',
        '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊',
        '😋', '😌', '😍', '😎', '😏', '😐', '😑', '😒', '😓', '😔',
        '😕', '😖', '😗', '😘', '😙', '😚', '😛', '😜', '😝', '😞',
        '😟', '😠', '😡', '😢', '😣', '😤', '😥', '😦', '😧', '😨',
        '😩', '😪', '😫', '😬', '😭', '😮', '😯', '😰', '😱', '😲',
        '😳', '😴', '😵', '😶', '😷', '😸', '😹', '😺', '😻', '😼',
        '😽', '😾', '😿', '🙀', '🙁', '🙂', '🙃', '🙄', '🙅', '🙆',
        '🙇', '🙈', '🙉', '🙊', '🙋', '🙌', '🙍', '🙎', '🙏', '🚀',
        '🚁', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊',
        '🚋', '🚌', '🚍', '🚎', '🚏', '🚐', '🚑', '🚒', '🚓', '🚔',
        '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🚝', '🚞',
        '🚟', '🚠', '🚡', '🚢', '🚣', '🚤', '🚥', '🚦', '🚧', '🚨',
        '🚩', '🚪', '🚫', '🚬', '🚭', '🚮', '🚯', '🚰', '🚱', '🚲',
        '🚳', '🚴', '🚵', '🚶', '🚷', '🚸', '🚹', '🚺', '🚻', '🚼',
        '🚽', '🚾', '🚿', '🛀', '🛁', '🛂', '🛃', '🛄', '🛅', '🛋',
        '🛌', '🛍', '🛎', '🛏', '🛐', '🛑', '🛒', '🛠', '🛡', '🛢',
        '🛣', '🛤', '🛥', '🛩', '🛫', '🛬', '🛰', '🛳', '🛴', '🛵',
        '🛶', '🛷', '🛸', '🛹', '🤐', '🤑', '🤒', '🤓', '🤔', '🤕',
        '🤖', '🤗', '🤘', '🤙', '🤚', '🤛', '🤜', '🤝', '🤞', '🤟',
        '🤠', '🤡', '🤢', '🤣', '🤤', '🤥', '🤦', '🤧', '🤨', '🤩',
        '🤪', '🤫', '🤬', '🤭', '🤮', '🤯', '🤰', '🤱', '🤲', '🤳',
        '🤴', '🤵', '🤶', '🤷', '🤸', '🤹', '🤺', '🤼', '🤽', '🤾',
        '🥀', '🥁', '🥂', '🥃', '🥄', '🥅', '🥇', '🥈', '🥉', '🥊',
        '🥋', '🥌', '🥍', '🥎', '🥏', '🥐', '🥑', '🥒', '🥓', '🥔',
        '🥕', '🥖', '🥗', '🥘', '🥙', '🥚', '🥛', '🥜', '🥝', '🥞',
        '🥟', '🥠', '🥡', '🥢', '🥣', '🥤', '🥥', '🥦', '🥧', '🥨',
        '🥩', '🥪', '🥫', '🥬', '🥭', '🥮', '🥯', '🥰', '🥳', '🥴',
        '🥵', '🥶', '🥺', '🥼', '🥽', '🥾', '🥿', '🦀', '🦁', '🦂',
        '🦃', '🦄', '🦅', '🦆', '🦇', '🦈', '🦉', '🦊', '🦋', '🦌',
        '🦍', '🦎', '🦏', '🦐', '🦑', '🦒', '🦓', '🦔', '🦕', '🦖',
        '🦗', '🦘', '🦙', '🦚', '🦛', '🦜', '🦝', '🦞', '🦟', '🦠',
        '🦡', '🦢', '🦰', '🦱', '🦲', '🦳', '🦴', '🦵', '🦶', '🦷',
        '🦸', '🦹', '🧀', '🧁', '🧂', '🧐', '🧑', '🧒', '🧓', '🧔',
        '🧕', '🧖', '🧗', '🧘', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞',
        '🧟', '🧠', '🧡', '🧢', '🧣', '🧤', '🧥', '🧦', '🧧', '🧨',
        '🧩', '🧪', '🧫', '🧬', '🧭', '🧮', '🧯', '🧰', '🧱', '🧲',
        '🧳', '🧴', '🧵', '🧶', '🧷', '🧸', '🧹', '🧺', '🧻', '🧼',
        '🧽', '🧾', '🧿', '🆗'
];

// 建立反向索引
const EMOJI_TO_INDEX = new Map<string, number>();
EMOJI_MAP.forEach((emoji, index) => {
  EMOJI_TO_INDEX.set(emoji, index);
});

// --- 2. 预设头像列表 ---
export const AVATARS = [
  '🌏','🦊','🐰','🐱','🐶',
  '🦁','🐯','🐼','🐻','🦄',
  '🐳','🦈','🐣','🦋','🌹',
  '🌻','🌼','🌱','🌳','🍁'
];
const AVATAR_SET = new Set(AVATARS); 

// --- 3. 压缩算法配置 ---
const BLOCK_SIZE = 5;      
const BITS_PER_VAL = 3;    

// 辅助：数字转指定长度二进制字符串
function toBits(num: number, length: number = BITS_PER_VAL): string {
  return num.toString(2).padStart(length, '0');
}

/**
 * ✅ 新增辅助函数：计算校验和 (Checksum)
 * 算法：将所有 10-bit 数据块的值求和，对字典长度取模，得到校验位的 Emoji 索引
 */
function calculateChecksum(indices: number[]): number {
  if (indices.length === 0) return 0;
  const sum = indices.reduce((acc, val) => acc + val, 0);
  return sum % EMOJI_MAP.length;
}

/**
 * 编码：头像 + 压缩后的 Emoji 数据流 + 校验位 Emoji
 */
export function encode(answers: Record<string, number[]>, avatar: string = '🌏'): string {
  
  // 第一步：数据扁平化
  const flatData: number[] = [];
  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const userStates = answers[q.id] || [];
      q.options.forEach((_, optIndex) => {
        let state = userStates[optIndex] || 0;
        // 🔄 修改：为了支持 6 种状态 (0-5)，这里将上限调整为 5
        // 3 bit 可以支持到 7 (0-7)，所以这里的修改是安全的
        if (state > 5) state = 0; 
        flatData.push(state);
      });
    });
  });

  // 寻找“有效数据的边界” (截断优化)
  let lastActiveBlockIndex = -1;
  for (let i = 0; i < flatData.length; i += BLOCK_SIZE) {
    const chunk = flatData.slice(i, i + BLOCK_SIZE);
    if (chunk.some(v => v !== 0)) {
      lastActiveBlockIndex = i;
    }
  }

  // 如果全是0，直接返回头像 (这里我们不加校验位，视为空数据的特殊情况)
  if (lastActiveBlockIndex === -1) return avatar;

  // 第二步：分块位图压缩
  let bitStream = "";
  for (let i = 0; i <= lastActiveBlockIndex; i += BLOCK_SIZE) {
    const chunk = flatData.slice(i, i + BLOCK_SIZE);
    const isAllZero = chunk.every(val => val === 0);

    if (isAllZero) {
      bitStream += "0";
    } else {
      bitStream += "1";
      chunk.forEach(val => {
        bitStream += toBits(val);
      });
    }
  }

  // 第三步：BitStream 转 Emoji + 计算校验位
  // 补齐 10 bit
  const remainder = bitStream.length % 10;
  if (remainder !== 0) {
    bitStream += "0".repeat(10 - remainder);
  }

  let result = "";
  const indices: number[] = []; // 用于存储转换后的索引，以便计算校验和

  for (let i = 0; i < bitStream.length; i += 10) {
    const chunkStr = bitStream.substring(i, i + 10);
    const val = parseInt(chunkStr, 2);
    
    // 记录索引用于校验
    indices.push(val);
    
    result += (EMOJI_MAP[val] !== undefined) ? EMOJI_MAP[val] : EMOJI_MAP[0];
  }

  // ✅ 新增：计算并追加校验位
  const checksumIndex = calculateChecksum(indices);
  const checksumEmoji = EMOJI_MAP[checksumIndex];

  return avatar + result + checksumEmoji;
}

/**
 * 解码：提取头像 + 校验数据 + 还原答案字典
 */
export function decode(code: string): { answers: Record<string, number[]>, avatar: string } {
  // ✅ 新增第一步：输入清洗 (Sanitization)
  // 移除所有空格、换行符、以及 Emoji 变体选择符-16 (\uFE0F，通常由微信等APP自动添加)
  // 这样可以防止查字典返回 undefined
  const cleanCode = code.replace(/[\s\n\r\uFE0F]/g, '');

  if (!cleanCode) {
    throw new Error("无效的代码：内容为空");
  }

  const chars = Array.from(cleanCode);
  
  // 1. 提取头像
  let avatar = '🌏'; 
  let dataAndChecksumChars: string[] = [];

  const firstChar = chars[0];
  if (firstChar && AVATAR_SET.has(firstChar)) {
    avatar = firstChar;
    // 如果有头像，剩下的就是 数据+校验
    dataAndChecksumChars = chars.slice(1); 
  } else {
    // 如果没头像，假设全是 数据+校验
    dataAndChecksumChars = chars;
  }

  // 边界检查：如果没有数据部分（或者长度不够包含校验位），直接返回空结果或报错
  if (dataAndChecksumChars.length < 1) {
      // 视为空数据，返回默认值
      return { answers: {}, avatar };
  }

  // ✅ 新增第二步：分离 数据体 和 校验位
  const providedChecksumEmoji = dataAndChecksumChars[dataAndChecksumChars.length - 1]; // 最后一位
  const dataEmojis = dataAndChecksumChars.slice(0, -1); // 中间部分

  // 2. Emoji 转 索引数组 + 校验
  const indices: number[] = [];
  let bitStream = "";

  for (const char of dataEmojis) {
    const val = EMOJI_TO_INDEX.get(char);
    if (val === undefined) {
      // 如果清洗后依然有无法识别的字符，说明代码已损坏
      throw new Error(`解析失败：包含无法识别的字符 "${char}"`);
    }
    indices.push(val);
    bitStream += toBits(val, 10); 
  }

  // ✅ 新增第三步：执行校验
  if (!providedChecksumEmoji) {
    throw new Error("校验失败：代码格式不完整，找不到校验位");
}
  const expectedChecksumIndex = EMOJI_TO_INDEX.get(providedChecksumEmoji);
  if (expectedChecksumIndex === undefined) {
      throw new Error("校验失败：校验位字符无效");
  }

  const calculatedChecksumIndex = calculateChecksum(indices);
  
  if (calculatedChecksumIndex !== expectedChecksumIndex) {
    // 这是最关键的拦截：如果计算结果和最后一位对不上，说明数据被篡改或截断
    throw new Error("数据校验失败：代码可能不完整或已被修改，请重新复制。");
  }

  // 3. 解压 BitStream 到扁平数组 (逻辑保持不变)
  const flatData: number[] = [];
  let ptr = 0;
  
  let totalOptionsCount = 0;
  questionsData.modules.forEach(m => m.questions.forEach(q => totalOptionsCount += q.options.length));

  while (ptr < bitStream.length && flatData.length < totalOptionsCount) {
    const header = bitStream[ptr];
    ptr++; 

    const remainingNeeded = totalOptionsCount - flatData.length;
    const currentBlockSize = Math.min(BLOCK_SIZE, remainingNeeded);

    if (header === '0') {
      for (let k = 0; k < currentBlockSize; k++) flatData.push(0);
    } else {
      for (let k = 0; k < currentBlockSize; k++) {
        if (ptr + 3 <= bitStream.length) {
          const valStr = bitStream.substring(ptr, ptr + 3);
          const val = parseInt(valStr, 2);
          flatData.push(val);
          ptr += 3;
        } else {
          flatData.push(0);
        }
      }
    }
  }

  // 自动补齐剩余的 0
  while (flatData.length < totalOptionsCount) {
    flatData.push(0);
  }

  // 4. 扁平数组 映射回 对象结构 (逻辑保持不变)
  const result: Record<string, number[]> = {};
  let dataPtr = 0;

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const qStates: number[] = [];
      let hasData = false;

      q.options.forEach(() => {
        const val = flatData[dataPtr] || 0;
        qStates.push(val);
        if (val > 0) hasData = true;
        dataPtr++;
      });

      if (hasData) {
        result[q.id] = qStates;
      }
    });
  });

  return { answers: result, avatar };
}