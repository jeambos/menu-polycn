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
 * 编码：头像 + 压缩后的 Emoji 数据流
 */
export function encode(answers: Record<string, number[]>, avatar: string = '🌏'): string {
  
  // 第一步：数据扁平化
  const flatData: number[] = [];
  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const userStates = answers[q.id] || [];
      q.options.forEach((_, optIndex) => {
        let state = userStates[optIndex] || 0;
        if (state > 4) state = 0; 
        flatData.push(state);
      });
    });
  });

  // ✅ 新增步骤：寻找“有效数据的边界”
  // 从后往前找，找到第一个非0的块的位置
  let lastActiveBlockIndex = -1;
  for (let i = 0; i < flatData.length; i += BLOCK_SIZE) {
    const chunk = flatData.slice(i, i + BLOCK_SIZE);
    if (chunk.some(v => v !== 0)) {
      lastActiveBlockIndex = i;
    }
  }

  // 如果全是0，直接返回头像
  if (lastActiveBlockIndex === -1) return avatar;

  // 第二步：分块位图压缩 (只处理到 lastActiveBlockIndex 为止)
  let bitStream = "";
  
  // 注意循环条件：包含 lastActiveBlockIndex 所在的块
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

  // 第三步：BitStream 转 Emoji
  // 补齐 10 bit
  const remainder = bitStream.length % 10;
  if (remainder !== 0) {
    bitStream += "0".repeat(10 - remainder);
  }

  let result = "";
  for (let i = 0; i < bitStream.length; i += 10) {
    const chunkStr = bitStream.substring(i, i + 10);
    const val = parseInt(chunkStr, 2);
    result += (EMOJI_MAP[val] !== undefined) ? EMOJI_MAP[val] : EMOJI_MAP[0];
  }

  return avatar + result;
}

/**
 * 解码：提取头像 + 还原答案字典
 */
export function decode(code: string): { answers: Record<string, number[]>, avatar: string } {
  const chars = Array.from(code);
  
  // 1. 提取头像
  let avatar = '🌏'; 
  let dataChars = chars;

  const firstChar = chars[0];
  if (firstChar && AVATAR_SET.has(firstChar)) {
    avatar = firstChar;
    dataChars = chars.slice(1); 
  }

  // 2. Emoji 转 BitStream
  let bitStream = "";
  for (const char of dataChars) {
    const val = EMOJI_TO_INDEX.get(char);
    if (val !== undefined) {
      bitStream += toBits(val, 10); 
    }
  }

  // 3. 解压 BitStream 到扁平数组
  const flatData: number[] = [];
  let ptr = 0;
  
  let totalOptionsCount = 0;
  questionsData.modules.forEach(m => m.questions.forEach(q => totalOptionsCount += q.options.length));

  // ✅ 逻辑修改：只要流里还有数据，就继续读；读完了就停止。
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

  // ✅ 新增步骤：自动补齐剩余的 0 (因为我们刚才截断了尾部)
  while (flatData.length < totalOptionsCount) {
    flatData.push(0);
  }

  // 4. 扁平数组 映射回 对象结构
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