/**
 * ==========================================================================
 * Rich Menu — ผังปุ่มและสคริปต์ติดตั้ง
 * ==========================================================================
 * ดูที่มาของผังนี้ที่ docs/PLAN_richmenu.md
 *
 * 🚨 กติกาข้อเดียวที่ห้ามลืม:
 *    Rich Menu = "รูปภาพ 1 ใบ" + "พิกัดพื้นที่กด" แยกกันคนละส่วน
 *    LINE ไม่ได้วาดปุ่มให้ — เราแค่บอกว่าพิกัดไหนกดแล้วทำอะไร
 *    ดังนั้น ถ้าแก้พิกัดในไฟล์นี้ ต้องแก้รูปให้ตรงกันเสมอ
 *    ไม่งั้นผู้ใช้จะกดตรงป้าย "รายงาน" แล้วได้อย่างอื่น
 *
 * ขนาดรูป: 2500 × 1686 px, ไม่เกิน 1 MB, JPEG หรือ PNG
 *
 * ปัญหาเดิมที่ผังนี้แก้:
 *    - เมนูคนสวน ปุ่ม 1-2 เปิดกล้อง QR เหมือนกันทั้งคู่ (แยก flow ไม่ได้จริง
 *      เพราะกล้อง LINE ไม่ส่งกลับมาว่ากดปุ่มไหนมา) -> ยุบเหลือปุ่มเดียว
 *      เพราะหน้า TreeInfo หลังสแกนมีให้เลือกทั้ง 2 อย่างอยู่แล้ว
 *    - เมนูผู้บริหาร ปุ่ม 3,4,5,6 เปิดเว็บหน้าเดียวกันหมด (Dashboard ยังไม่รองรับ
 *      deep-link ไปแท็บ) -> ตอนนี้รองรับแล้ว และย้ายไปอยู่ในการ์ด "ระบบจัดการ"
 *    - ปุ่ม "AppSheet" เป็นซากจากแผนเก่าที่เลิกใช้แล้ว -> ตัดทิ้ง
 */

// ==========================================================================
// ผังปุ่ม — แหล่งความจริงเดียว (ใช้ทั้งตอนสร้างเมนูและตอนเทสต์)
// ==========================================================================

const MENU_SIZE = { width: 2500, height: 1686 };

/**
 * รูปจริงที่วาดมามีแถบหัวเรื่อง (โลโก้ + ชื่อเมนู) กินพื้นที่ด้านบนก่อนถึงแถวปุ่ม
 * เลยวัดพิกัดจากรูปจริง (Owner.png / Famer.png) แทนที่จะหารครึ่งเท่าๆ กันจาก y=0
 * ถ้าเปลี่ยนรูปใหม่ที่ไม่มีหัวเรื่องแล้ว ให้ปรับค่าพวกนี้กลับเป็นแบ่งครึ่งเท่าๆ กัน
 */

/**
 * เมนูเจ้าของสวน/admin — 6 ปุ่ม (3 คอลัมน์ × 2 แถว) ไม่ซ้ำกันเลย
 * วัดจาก Owner.png จริง: หัวเรื่องสูง ~250px, แถวบนสูง 655px, แถวล่างสูง 781px
 *
 *   ┌─── หัวเรื่อง "เมนูเจ้าของสวน" ───┐
 *   ┌───────────┬───────────┬───────────┐
 *   │✅ รออนุมัติ│📦 บันทึก  │📷 สแกน    │  แถวบน = งานประจำวัน
 *   │           │  การขาย   │  ต้นไม้    │
 *   ├───────────┼───────────┼───────────┤
 *   │🌱 ลงทะเบียน│📊 รายงาน  │⚙️ ระบบ    │  แถวล่าง = ดูข้อมูล/จัดการ
 *   │   ต้นไม้   │           │   จัดการ   │
 *   └───────────┴───────────┴───────────┘
 */
const OWNER_ROW1_Y = 250;
const OWNER_ROW1_H = 655;
const OWNER_ROW2_Y = 905;
const OWNER_ROW2_H = 781;
const OWNER_COL1_X = 0;
const OWNER_COL1_W = 850;
const OWNER_COL2_X = 850;
const OWNER_COL2_W = 800;
const OWNER_COL3_X = 1650;
const OWNER_COL3_W = 850;

const OWNER_MENU_LAYOUT = [
  { label: 'รออนุมัติ',       bounds: { x: OWNER_COL1_X, y: OWNER_ROW1_Y, width: OWNER_COL1_W, height: OWNER_ROW1_H }, action: { type: 'postback', data: 'action=APPROVAL_LIST', displayText: 'รออนุมัติ' } },
  { label: 'บันทึกการขาย',   bounds: { x: OWNER_COL2_X, y: OWNER_ROW1_Y, width: OWNER_COL2_W, height: OWNER_ROW1_H }, action: { type: 'postback', data: 'action=SALE_ROUND',    displayText: 'บันทึกการขาย' } },
  { label: 'สแกนต้นไม้',     bounds: { x: OWNER_COL3_X, y: OWNER_ROW1_Y, width: OWNER_COL3_W, height: OWNER_ROW1_H }, action: { type: 'uri',      uri: 'https://line.me/R/nv/QRCodeReader' } },
  { label: 'ลงทะเบียนต้นไม้', bounds: { x: OWNER_COL1_X, y: OWNER_ROW2_Y, width: OWNER_COL1_W, height: OWNER_ROW2_H }, action: { type: 'postback', data: 'action=REGISTER_TREE', displayText: 'ลงทะเบียนต้นไม้' } },
  { label: 'รายงาน',         bounds: { x: OWNER_COL2_X, y: OWNER_ROW2_Y, width: OWNER_COL2_W, height: OWNER_ROW2_H }, action: { type: 'postback', data: 'action=DASHBOARD',     displayText: 'รายงาน' } },
  { label: 'ระบบจัดการ',     bounds: { x: OWNER_COL3_X, y: OWNER_ROW2_Y, width: OWNER_COL3_W, height: OWNER_ROW2_H }, action: { type: 'postback', data: 'action=MANAGE',        displayText: 'ระบบจัดการ' } }
];

/**
 * เมนูคนสวน — 4 ปุ่ม (2×2) วัดจาก Famer_4btn_2500x1686.jpg จริง
 * (เดิมมี 3 ปุ่ม เพิ่ม "บันทึกการขาย" เข้ามาตอนเปิดให้คนสวนส่งรายการขาย
 * เข้าคิวรอเจ้าของอนุมัติได้ — ดู action=SALE_ROUND ใน Code.gs)
 *
 *   ┌─── หัวเรื่อง "เมนูคนสวน" ───┐
 *   ┌─────────────────┬─────────────────┐
 *   │  📷 แสกนต้นไม้   │  🌱 ลงทะเบียน   │  แถวบน
 *   │ (บันทึกทุกอย่าง) │     ต้นไม้      │
 *   ├─────────────────┼─────────────────┤
 *   │  📦 บันทึกการขาย │   📊 รายงาน     │  แถวล่าง
 *   └─────────────────┴─────────────────┘
 *
 * ปุ่มสแกนปุ่มเดียวพอ เพราะหลังสแกนจะไปหน้า TreeInfo ที่มีปุ่ม
 * "บันทึกตัดจำหน่าย" กับ "บันทึกผลผลิต" ให้เลือกอยู่แล้ว
 * ใช้เส้นแบ่งกลางจอ (contiguous) แทนขอบกล่องในรูปเป๊ะๆ ให้พื้นที่กดใหญ่กว่า
 * เผื่อกดเพี้ยนขอบกล่องนิดหน่อยไม่พลาดปุ่ม เหมือนแนวทางเดิมของ OWNER_MENU_LAYOUT
 */
const WORKER_ROW1_Y = 420;
const WORKER_ROW_SPLIT = 1000;
const WORKER_ROW1_H = WORKER_ROW_SPLIT - WORKER_ROW1_Y;
const WORKER_ROW2_Y = WORKER_ROW_SPLIT;
const WORKER_ROW2_H = 1686 - WORKER_ROW_SPLIT;
const WORKER_COL_SPLIT = 1250;

const WORKER_MENU_LAYOUT = [
  { label: 'สแกนต้นไม้',     bounds: { x: 0,               y: WORKER_ROW1_Y, width: WORKER_COL_SPLIT,        height: WORKER_ROW1_H }, action: { type: 'uri',      uri: 'https://line.me/R/nv/QRCodeReader' } },
  { label: 'ลงทะเบียนต้นไม้', bounds: { x: WORKER_COL_SPLIT, y: WORKER_ROW1_Y, width: 2500 - WORKER_COL_SPLIT, height: WORKER_ROW1_H }, action: { type: 'postback', data: 'action=REGISTER_TREE', displayText: 'ลงทะเบียนต้นไม้' } },
  { label: 'บันทึกการขาย',   bounds: { x: 0,               y: WORKER_ROW2_Y, width: WORKER_COL_SPLIT,        height: WORKER_ROW2_H }, action: { type: 'postback', data: 'action=SALE_ROUND',    displayText: 'บันทึกการขาย' } },
  { label: 'รายงาน',         bounds: { x: WORKER_COL_SPLIT, y: WORKER_ROW2_Y, width: 2500 - WORKER_COL_SPLIT, height: WORKER_ROW2_H }, action: { type: 'postback', data: 'action=DASHBOARD',     displayText: 'รายงาน' } }
];

/**
 * เมนูลูกค้า — ปุ่มเดียวเต็มพื้นที่ แต่ใช้ขนาด "compact" (2500×843) แทน full size
 * เพราะรูปที่วาดมาเป็นแบนเนอร์แนวยาว (สัดส่วน ~2500×943 ใกล้ compact มากกว่า full)
 * ขนาด compact ทำให้แชทยังมองเห็นอยู่ครึ่งจอ ไม่บังเต็มจอเหมือน owner/worker
 */
const CUSTOMER_MENU_SIZE = { width: 2500, height: 843 };
const CUSTOMER_MENU_LAYOUT = [
  { label: 'สแกนต้นไม้', bounds: { x: 0, y: 0, width: 2500, height: 843 }, action: { type: 'uri', uri: 'https://line.me/R/nv/QRCodeReader' } }
];

/** รวมผังทั้งหมดไว้ที่เดียว ให้เทสต์ไล่ตรวจได้ */
const MENU_LAYOUTS = {
  owner:    { name: 'Owner Menu',    chatBarText: 'เมนูเจ้าของสวน', areas: OWNER_MENU_LAYOUT,    size: MENU_SIZE },
  worker:   { name: 'Worker Menu',   chatBarText: 'เมนูคนสวน',      areas: WORKER_MENU_LAYOUT,   size: MENU_SIZE },
  customer: { name: 'Customer Menu', chatBarText: 'สแกนต้นไม้',     areas: CUSTOMER_MENU_LAYOUT, size: CUSTOMER_MENU_SIZE }
};

/** แปลงผังเป็น payload ที่ LINE API ต้องการ (ตัด label ที่ใช้อ่านเฉยๆ ออก) */
function buildRichMenuPayload(key) {
  const layout = MENU_LAYOUTS[key];
  if (!layout) throw new Error('ไม่รู้จักเมนู: ' + key);
  return {
    size: layout.size,
    selected: true,
    name: layout.name,
    chatBarText: layout.chatBarText,
    areas: layout.areas.map(function (a) { return { bounds: a.bounds, action: a.action }; })
  };
}

// ==========================================================================
// ขั้นตอนติดตั้ง (รันตามลำดับใน Apps Script editor)
// ==========================================================================

/**
 * ขั้นที่ 1: สร้างเมนูทั้ง 3 แบบบน LINE (ยังไม่มีรูป ยังใช้ไม่ได้)
 * จด ID ที่ได้จาก Log ไปใส่ใน setupStep2_uploadImages() แล้วรันขั้นถัดไป
 */
function setupStep1_createMenus() {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  if (!token) { Logger.log('❌ ไม่พบ CHANNEL_ACCESS_TOKEN ใน Script Properties'); return; }

  const result = {};
  ['owner', 'worker', 'customer'].forEach(function (key) {
    try {
      result[key] = createRichMenuAPI(buildRichMenuPayload(key), token);
      Logger.log('✅ สร้าง ' + MENU_LAYOUTS[key].name + ' -> ' + result[key]);
    } catch (err) {
      Logger.log('❌ สร้าง ' + MENU_LAYOUTS[key].name + ' ไม่สำเร็จ: ' + err);
    }
  });

  Logger.log('');
  Logger.log('=== ขั้นต่อไป ===');
  Logger.log('1. เอา ID ข้างบนไปใส่ใน setupStep2_uploadImages() (ตัวแปร MENU_IDS)');
  Logger.log('2. อัปโหลดรูป 3 ใบขึ้น Google Drive แล้วเอา File ID มาใส่ด้วย');
  Logger.log('3. รัน setupStep2_uploadImages()');
  return result;
}

/**
 * ขั้นที่ 2: อัปโหลดรูปให้แต่ละเมนู
 * ⚠️ ต้องแก้ค่า 2 ชุดข้างล่างก่อนรัน
 */
function setupStep2_uploadImages() {
  // เอามาจาก Log ของ setupStep1_createMenus() รอบล่าสุด (2026-07-30 11:06)
  // customer ตัวนี้สร้างหลังแก้ขนาดเป็น compact (2500x843) แล้ว ถูกต้อง
  const MENU_IDS = {
    owner: 'richmenu-8a9b2d14e992dce11ce80c213695d399',
    worker: 'richmenu-9f73e77bb3f728c779dcb04ffcbb18ae',
    customer: 'richmenu-4dc8d78de7d0570e6d441eb5291ed888'
  };
  // File ID ของรูปใน Google Drive (owner/worker = 2500×1686, customer = 2500×843, <1MB)
  const IMAGE_FILE_IDS = {
    owner: '1EuDc8ayxb5J_ZF1eh4dlSs3K5jW2e93F',
    worker: '1s8fST4MLdCq_vrCm65_wwKxmrwJezddT',
    customer: '105VhCZkNfq-OTt7rXjZ3e3YkqtvnD6sM' // แก้ขนาดเป็น 2500x843 (compact) แล้ว
  };

  let ready = true;
  ['owner', 'worker', 'customer'].forEach(function (key) {
    if (MENU_IDS[key].indexOf('ใส่_') === 0 || IMAGE_FILE_IDS[key].indexOf('ใส่_') === 0) {
      Logger.log('⚠️ ยังไม่ได้ใส่ค่าของ ' + key);
      ready = false;
    }
  });
  if (!ready) { Logger.log('❌ กรุณาใส่ค่าให้ครบก่อนรัน'); return; }

  ['owner', 'worker', 'customer'].forEach(function (key) {
    uploadRichMenuImageFromDrive(MENU_IDS[key], IMAGE_FILE_IDS[key]);
  });

  Logger.log('');
  Logger.log('=== ขั้นต่อไป ===');
  Logger.log('1. เอา ID ทั้ง 3 ไปแก้ RICH_MENU_IDS ใน SheetOperations.gs');
  Logger.log('   (admin ใช้ ID เดียวกับ owner)');
  Logger.log('2. รัน setDefaultRichMenu("' + MENU_IDS.customer + '") ตั้งเมนูลูกค้าเป็นค่าเริ่มต้น');
  Logger.log('3. รัน resyncAllRichMenus() ผูกเมนูใหม่ให้ทุกคนตาม role');
  Logger.log('4. รัน listRichMenus() แล้วลบเมนูเก่าที่ไม่ใช้ด้วย deleteRichMenu(id)');
}

/**
 * ตั้งเมนูลูกค้าเป็นค่าเริ่มต้น — กด Run ตรงนี้ได้เลย (ไม่ต้องพิมพ์ ID เอง)
 * ⚠️ ห้ามกด Run ที่ setDefaultRichMenu(richMenuId) ตรงๆ จาก dropdown เพราะปุ่ม Run
 *    ของ Apps Script ไม่ส่ง parameter ให้ ฟังก์ชันจะได้ richMenuId = undefined
 *    แล้วจะเจอ "Not found" แบบที่เจอมา ต้องห่อเป็นฟังก์ชันเปล่าแบบนี้เสมอ
 */
function runSetDefaultCustomerMenu() {
  setDefaultRichMenu('richmenu-4dc8d78de7d0570e6d441eb5291ed888');
}

/**
 * ล้างเมนูเก่าที่ค้างจากการ setupStep1_createMenus() หลายรอบ + เมนูรุ่นก่อนหน้านี้
 * เหลือไว้แค่ 3 ใบที่ถูกต้อง: owner=8a9b2d14... worker=9f73e77b... customer=4dc8d78d...
 * ⚠️ รันได้เฉพาะหลังจากอัปเดต RICH_MENU_IDS (SheetOperations.gs) และรัน resyncAllRichMenus()
 *    แล้วเท่านั้น ไม่งั้นถ้ายังมีผู้ใช้ผูกกับ ID เก่าอยู่ จะตกไปเมนู Default ทันที
 */
function cleanupOldRichMenus() {
  const staleIds = [
    'richmenu-0612d57695e0192f9ebcf22afabf4ccf', // customer รอบแรก ขนาดผิด ไม่มีรูป
    'richmenu-1b290a9e1e03dafc27a0cd61dffb4f14', // owner รอบแรก ไม่มีรูป
    'richmenu-90b1fc960a1d06c91309b5c3cb2281ad', // worker รอบแรก ไม่มีรูป
    'richmenu-6aeef5cf6cfd36b6150d498c4cd7509e', // admin รุ่นก่อน (เคยใช้อยู่ใน RICH_MENU_IDS)
    'richmenu-36623b6970c5491f16332221a8f5eaa2', // worker รุ่นก่อน (เคยใช้อยู่ใน RICH_MENU_IDS)
    'richmenu-275478d29a58253eacf727ca4e00d179', // customer รุ่นก่อน (เคยใช้อยู่ใน RICH_MENU_IDS)
    'richmenu-e965ba0fb0d93888408f7dd7cdf2b336', // admin ค้างจากรุ่นเก่ากว่านั้นอีก
    'richmenu-d81e8c1786a1de17ef9cc412e5e14038'  // worker ค้างจากรุ่นเก่ากว่านั้นอีก
  ];
  staleIds.forEach(function (id) { deleteRichMenu(id); });
  Logger.log('');
  Logger.log('เหลือไว้ 3 ใบ: owner=richmenu-8a9b2d14e992dce11ce80c213695d399, ' +
    'worker=richmenu-9f73e77bb3f728c779dcb04ffcbb18ae, customer=richmenu-4dc8d78de7d0570e6d441eb5291ed888');
}

/**
 * แก้เฉพาะกิจ: เมนู customer ที่สร้างไปแล้วใช้ขนาด full (2500×1686) ผิด
 * ต้องลบทิ้งแล้วสร้างใหม่ด้วยขนาด compact (2500×843) ให้ตรงกับรูปแบนเนอร์จริง
 * รันฟังก์ชันนี้ตัวเดียว แล้วจด ID ใหม่จาก Log ไปใส่ MENU_IDS.customer
 * ใน setupStep2_uploadImages() ก่อนรันขั้นถัดไป
 */
function recreateCustomerMenu() {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  if (!token) { Logger.log('❌ ไม่พบ CHANNEL_ACCESS_TOKEN ใน Script Properties'); return; }

  deleteRichMenu('richmenu-0612d57695e0192f9ebcf22afabf4ccf');

  const newId = createRichMenuAPI(buildRichMenuPayload('customer'), token);
  Logger.log('✅ สร้าง Customer Menu (compact 2500x843) ใหม่ -> ' + newId);
  Logger.log('');
  Logger.log('=== ขั้นต่อไป ===');
  Logger.log('เอา ID นี้ไปแทนที่ MENU_IDS.customer ใน setupStep2_uploadImages() แล้วรันฟังก์ชันนั้นต่อ');
  return newId;
}

/**
 * เมนูคนสวนเปลี่ยนจาก 3 ปุ่มเป็น 4 ปุ่ม (เพิ่ม "บันทึกการขาย") — LINE ไม่ให้แก้
 * พิกัดปุ่มของเมนูเดิมได้ ต้องสร้างใบใหม่แล้วเปลี่ยนไปใช้ใบนั้นแทน
 * ขั้นตอน:
 *   1. อัปโหลดรูป Famer_4btn_2500x1686.jpg ขึ้น Google Drive จดไฟล์ ID มา
 *   2. รันฟังก์ชันนี้ (ใส่ driveFileId ที่ได้จากข้อ 1) จด ID ใหม่จาก Log
 *   3. เอา ID ใหม่ไปแทนที่ RICH_MENU_IDS.worker ใน SheetOperations.gs
 *   4. รัน resyncAllRichMenus() ผูกเมนูใหม่ให้คนสวนทุกคน
 *   5. ตรวจว่าใช้ได้จริงแล้วค่อยรัน deleteRichMenu('richmenu-9f73e77bb3f728c779dcb04ffcbb18ae') ลบใบเก่า
 */
function recreateWorkerMenu(driveFileId) {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  if (!token) { Logger.log('❌ ไม่พบ CHANNEL_ACCESS_TOKEN ใน Script Properties'); return; }
  if (!driveFileId) { Logger.log('❌ กรุณาใส่ driveFileId ของรูป Famer_4btn_2500x1686.jpg ที่อัปโหลดขึ้น Drive แล้ว'); return; }

  const newId = createRichMenuAPI(buildRichMenuPayload('worker'), token);
  Logger.log('✅ สร้าง Worker Menu (4 ปุ่ม) ใหม่ -> ' + newId);

  uploadRichMenuImageFromDrive(newId, driveFileId);

  Logger.log('');
  Logger.log('=== ขั้นต่อไป ===');
  Logger.log('1. เอา ID นี้ไปแทนที่ RICH_MENU_IDS.worker ใน SheetOperations.gs: ' + newId);
  Logger.log('2. รัน resyncAllRichMenus() ผูกเมนูใหม่ให้คนสวนทุกคน');
  Logger.log('3. ตรวจว่าคนสวนเห็นเมนู 4 ปุ่มถูกต้องแล้วค่อยรัน deleteRichMenu(\'richmenu-9f73e77bb3f728c779dcb04ffcbb18ae\') ลบใบเก่า');
  return newId;
}

/**
 * scrutinize 2026-07-30: root cause ของ "worker เด้งเป็นเมนูเจ้าของสวน" เจอแล้ว —
 * ไม่ใช่บั๊กโค้ด/cache/platform เลย runRecreateWorkerMenu() รอบก่อนอัปโหลด
 * "Admin_richmenu.jpg" (ไฟล์เมนูเจ้าของสวน) ไปที่ richmenu-e4b2d19b... โดยไม่ตั้งใจ
 * (ก๊อปลิงก์ Drive ผิดไฟล์) ส่วน areas/chatBarText/size ของเมนูนั้นถูกต้อง 100%
 * อยู่แล้ว (ตรวจด้วย inspectWorkerRichMenu แล้วตรงกับโค้ดทุกช่อง)
 *
 * ⚠️ ลองอัปรูปทับ ID เดิมแล้ว — LINE ปฏิเสธ: "An image has already been uploaded
 * to the richmenu" (จำกัดของ API เอง เมนูที่มีรูปแล้วอัปทับไม่ได้ ต้องลบแล้ว
 * สร้างใหม่เท่านั้น) เปลี่ยนแผนเป็นสร้างเมนูใหม่อีกใบด้วยไฟล์ที่ถูกต้อง — ใช้
 * runRecreateWorkerMenu() ด้านล่าง (แก้ driveFileId เป็นไฟล์ที่ถูกต้องแล้ว)
 */
function runFixWorkerMenuImage_DEPRECATED_seeRunRecreateWorkerMenu() {
  // เก็บไว้เป็นหมายเหตุ — ห้ามใช้ เพราะ LINE จะตอบ error เสมอถ้าเมนูมีรูปแล้ว
}

/**
 * ⚠️ ห้ามกด Run ที่ recreateWorkerMenu(driveFileId) ตรงๆ จาก dropdown — ปุ่ม Run
 *    ของ Apps Script ไม่มีช่องให้กรอก parameter ฟังก์ชันจะได้ driveFileId = undefined
 *    (บทเรียนเดียวกับ runSetDefaultCustomerMenu() ด้านบน) ห่อเป็นฟังก์ชันเปล่าแบบนี้
 *    แทน — ใส่ driveFileId ของรูป Famer_4btn_2500x1686.jpg ที่อัปโหลดขึ้น Drive แล้วให้เลย
 *    เลือก runRecreateWorkerMenu จาก dropdown แล้วกด Run ได้ทันที
 */
function runRecreateWorkerMenu() {
  // scrutinize 2026-07-30: ID เดิม (1uz0DD0D1DSkoX7kUZUi7n1R3XjodtAqz) ชี้ไปที่
  // "Admin_richmenu.jpg" โดยไม่ตั้งใจ (ก๊อปลิงก์ Drive ผิดไฟล์ตอนแชร์) — เปลี่ยน
  // เป็น ID ที่ยืนยันแล้วว่าเป็น Famer_4btn_2500x1686.jpg (440,296 bytes) จริง
  recreateWorkerMenu('1P8Y8l46EDrCCrYYDtWwDLfRIUZaIoVib');
}

// ==========================================================================
// LINE API helpers
// ==========================================================================

function createRichMenuAPI(menuObj, token) {
  const url = "https://api.line.me/v2/bot/richmenu";
  const options = {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    payload: JSON.stringify(menuObj),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200) throw new Error(json.message || 'API Error');
  return json.richMenuId;
}

function setDefaultRichMenu(richMenuId) {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const response = UrlFetchApp.fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  Logger.log(response.getResponseCode() === 200
    ? '✅ ตั้งเมนูเริ่มต้นสำเร็จ'
    : '❌ ' + response.getContentText());
}

function removeDefaultRichMenu() {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const response = UrlFetchApp.fetch(`https://api.line.me/v2/bot/user/all/richmenu`, {
    method: 'delete',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  Logger.log(response.getResponseCode() === 200
    ? '✅ ยกเลิกเมนูเริ่มต้นแล้ว'
    : '❌ ' + response.getContentText());
}

/** ลบเมนูที่ไม่ใช้แล้ว (ดู ID ได้จาก listRichMenus() ใน TestSwitch.gs) */
function deleteRichMenu(richMenuId) {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const response = UrlFetchApp.fetch(`https://api.line.me/v2/bot/richmenu/${richMenuId}`, {
    method: 'delete',
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  Logger.log(response.getResponseCode() === 200
    ? '✅ ลบเมนู ' + richMenuId + ' แล้ว'
    : '❌ ' + response.getContentText());
}

/**
 * อัปโหลดรูป Rich Menu จาก Google Drive
 * @param {string} richMenuId - ID ของ Rich Menu
 * @param {string} driveFileId - File ID ของรูป (2500×1686 px, ไม่เกิน 1MB)
 */
function uploadRichMenuImageFromDrive(richMenuId, driveFileId) {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const url = `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`;

  try {
    const file = DriveApp.getFileById(driveFileId);
    const blob = file.getBlob();
    const contentType = file.getMimeType();

    if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
      Logger.log('❌ ' + file.getName() + ' ต้องเป็น JPEG หรือ PNG เท่านั้น (ได้ ' + contentType + ')');
      return;
    }

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': contentType },
      payload: blob,
      muteHttpExceptions: true
    });

    Logger.log(response.getResponseCode() === 200
      ? '✅ อัปโหลดรูปให้ ' + richMenuId + ' สำเร็จ'
      : '❌ อัปโหลดรูปไม่สำเร็จ: ' + response.getContentText());
  } catch (err) {
    Logger.log('❌ ดึงไฟล์จาก Drive ไม่ได้: ' + err.toString());
  }
}

// ==========================================================================
// Diagnostic — ตรวจผังก่อนสร้างจริง (ไม่ยิง API)
// ==========================================================================

/**
 * ตรวจผังปุ่มว่ามีปัญหาที่เคยเจอมาก่อนหรือไม่:
 *   - ปุ่มซ้ำ (ชี้ปลายทางเดียวกัน) <- ปัญหาที่ทำให้ต้องรื้อรอบนี้
 *   - พิกัดทับกัน / เกินขอบรูป
 * รันได้ตลอด ไม่แตะอะไรเลย
 */
function verifyMenuLayouts() {
  const problems = [];

  Object.keys(MENU_LAYOUTS).forEach(function (key) {
    const layout = MENU_LAYOUTS[key];
    const seen = {};

    layout.areas.forEach(function (a, i) {
      // 1) ปลายทางซ้ำ
      const target = a.action.type === 'uri' ? a.action.uri : a.action.data;
      if (seen[target]) {
        problems.push('❌ [' + layout.name + '] ปุ่ม "' + a.label + '" ชี้ที่เดียวกับ "' + seen[target] + '" -> ' + target);
      }
      seen[target] = a.label;

      // 2) เกินขอบรูป (แต่ละเมนูอาจใช้ขนาดไม่เท่ากัน เช่น customer เป็น compact)
      const b = a.bounds;
      const sz = layout.size || MENU_SIZE;
      if (b.x < 0 || b.y < 0 || b.x + b.width > sz.width || b.y + b.height > sz.height) {
        problems.push('❌ [' + layout.name + '] ปุ่ม "' + a.label + '" พิกัดเกินขอบรูป');
      }

      // 3) ทับกับปุ่มก่อนหน้า
      layout.areas.slice(0, i).forEach(function (other) {
        const o = other.bounds;
        const overlap = b.x < o.x + o.width && o.x < b.x + b.width &&
                        b.y < o.y + o.height && o.y < b.y + b.height;
        if (overlap) {
          problems.push('❌ [' + layout.name + '] ปุ่ม "' + a.label + '" ทับกับ "' + other.label + '"');
        }
      });
    });

    Logger.log('--- ' + layout.name + ' (' + layout.areas.length + ' ปุ่ม) ---');
    layout.areas.forEach(function (a) {
      const target = a.action.type === 'uri' ? a.action.uri : a.action.data;
      Logger.log('  ' + a.label + '  ->  ' + target);
    });
  });

  Logger.log('');
  const result = problems.length === 0 ? '✅ ผังปุ่มถูกต้อง ไม่มีปุ่มซ้ำหรือพิกัดทับกัน' : problems.join('\n');
  Logger.log(result);
  return result;
}

/**
 * Diagnostic ชี้ขาด: ดึงข้อมูล Rich Menu "worker" ตัวปัจจุบัน (RICH_MENU_IDS.worker)
 * ตรงจาก LINE server มาเทียบกับที่โค้ดตั้งใจสร้าง (buildRichMenuPayload) ทีละช่อง
 * เหตุผลที่ต้องมีอันนี้: checkMyRichMenu() (TestSwitch.gs) เช็คได้แค่ "ผูกกับ ID ไหน"
 * แต่ไม่เคยเช็คว่า ID นั้น "ข้างในถูกต้องจริงไหม" — ถ้า LINE server รับ areas/size
 * ที่ผิดพลาดตอนสร้าง (ไม่ error) แต่ client ปฏิเสธไม่แสดง จะเจออาการเป๊ะแบบที่พบ:
 * server ยืนยันว่า link ID ถูกแล้ว แต่หน้าจอไม่เปลี่ยน
 */
function inspectWorkerRichMenu() {
  const token = getConfig('CHANNEL_ACCESS_TOKEN');
  const id = RICH_MENU_IDS.worker;
  Logger.log('=== ตรวจ Rich Menu "worker" (' + id + ') ===');

  // 1) สิ่งที่โค้ดไฟล์นี้ "ตั้งใจ" จะสร้าง ณ ตอนนี้
  const expected = buildRichMenuPayload('worker');
  Logger.log('--- (A) โค้ดตั้งใจให้เป็นแบบนี้ (จาก WORKER_MENU_LAYOUT ปัจจุบัน) ---');
  Logger.log(JSON.stringify(expected, null, 2));

  // 2) สิ่งที่ LINE เก็บไว้จริงสำหรับ ID นี้
  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/richmenu/' + id,
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  Logger.log('--- (B) LINE เก็บไว้จริง (HTTP ' + res.getResponseCode() + ') ---');
  Logger.log(res.getContentText());

  if (res.getResponseCode() === 200) {
    const actual = JSON.parse(res.getContentText());
    const mismatches = [];
    if (actual.size.width !== expected.size.width || actual.size.height !== expected.size.height) {
      mismatches.push('size ไม่ตรง: server=' + JSON.stringify(actual.size) + ' vs โค้ด=' + JSON.stringify(expected.size));
    }
    if (actual.areas.length !== expected.areas.length) {
      mismatches.push('จำนวนปุ่มไม่ตรง: server มี ' + actual.areas.length + ' ปุ่ม vs โค้ดตั้งใจ ' + expected.areas.length + ' ปุ่ม');
    }
    expected.areas.forEach(function (exp, i) {
      const act = actual.areas[i];
      if (!act) return;
      const b1 = exp.bounds, b2 = act.bounds;
      if (b1.x !== b2.x || b1.y !== b2.y || b1.width !== b2.width || b1.height !== b2.height) {
        mismatches.push('ปุ่มลำดับ ' + i + ' พิกัดไม่ตรง: server=' + JSON.stringify(b2) + ' vs โค้ด=' + JSON.stringify(b1));
      }
      const target1 = exp.action.type === 'uri' ? exp.action.uri : exp.action.data;
      const target2 = act.action.type === 'uri' ? act.action.uri : act.action.data;
      if (target1 !== target2) {
        mismatches.push('ปุ่มลำดับ ' + i + ' action ไม่ตรง: server=' + target2 + ' vs โค้ด=' + target1);
      }
    });
    Logger.log('');
    Logger.log(mismatches.length === 0
      ? '✅ (A) กับ (B) ตรงกันทุกช่อง — areas/size/action ที่ LINE เก็บไว้ตรงกับที่โค้ดตั้งใจ 100%'
      : '❌ พบความไม่ตรงกันระหว่าง (A) โค้ด กับ (B) LINE server:\n' + mismatches.join('\n'));
  }

  // 3) เช็ครูปภาพที่ผูกกับเมนูนี้จริง (แยก endpoint จาก definition ข้างบน)
  const imgRes = UrlFetchApp.fetch('https://api-data.line.me/v2/bot/richmenu/' + id + '/content',
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  const imgCode = imgRes.getResponseCode();
  Logger.log('');
  if (imgCode === 200) {
    const blob = imgRes.getBlob();
    Logger.log('--- (C) รูปภาพ: ✅ ดึงได้ | Content-Type: ' + blob.getContentType() +
      ' | ขนาดไฟล์: ' + blob.getBytes().length + ' bytes ---');
  } else {
    Logger.log('--- (C) รูปภาพ: ❌ ดึงไม่ได้ (HTTP ' + imgCode + ') ' + imgRes.getContentText() +
      ' — ถ้าไม่มีรูปจริง นี่คือสาเหตุตรงๆ ที่ client ไม่ยอมสลับเมนู ---');
  }
}
