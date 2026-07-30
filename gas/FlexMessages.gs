function getDriveImageUrlForLine(driveUrl) {
  if (!driveUrl) return '';
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  return '';
}

function buildTreeInfoFlex(treeInfo, remaining, harvestHistory) {
  const treePhotoRaw = treeInfo['\u0e23\u0e39\u0e1b\u0e20\u0e32\u0e1e URL'] || '';
  const treePhotoUrls = treePhotoRaw ? treePhotoRaw.split(',') : [];
  const treePhotoUrl = getDriveImageUrlForLine(treePhotoUrls[0] || '');
  const bubbles = [];

  // 1. การ์ดแรก: ข้อมูลต้นไม้ (Profile)
  const profileBody = [
    { type: 'text', text: `\u0e15\u0e49\u0e19 ${treeInfo['\u0e23\u0e2b\u0e31\u0e2a\u0e15\u0e49\u0e19']}`, weight: 'bold', size: 'xl', color: '#1DB446' },
    { type: 'separator', margin: 'md' },
    {
      type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
      contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: '\u0e1e\u0e31\u0e19\u0e18\u0e38\u0e4c',        color: '#888888', size: 'sm', flex: 3 },
          { type: 'text', text: treeInfo['\u0e1e\u0e31\u0e19\u0e18\u0e38\u0e4c'] || '-',           size: 'sm', flex: 5, weight: 'bold' }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: '\u0e2d\u0e32\u0e22\u0e38\u0e15\u0e49\u0e19',       color: '#888888', size: 'sm', flex: 3 },
          { type: 'text', text: `${treeInfo['\u0e2d\u0e32\u0e22\u0e38(\u0e1b\u0e35)'] || '-'} \u0e1b\u0e35`,   size: 'sm', flex: 5 }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: '\u0e2d\u0e2d\u0e01\u0e14\u0e2d\u0e01',      color: '#888888', size: 'sm', flex: 3 },
          { type: 'text', text: treeInfo['\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e2d\u0e2d\u0e01\u0e14\u0e2d\u0e01'] || '-',      size: 'sm', flex: 5 }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: '\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d',      color: '#888888', size: 'sm', flex: 3 },
          { type: 'text', text: `${remaining} \u0e25\u0e39\u0e01`,      size: 'sm', flex: 5, color: '#e53935', weight: 'bold' }
        ]}
      ]
    }
  ];

  if (treePhotoUrls.length > 1) {
    profileBody.push({ type: 'text', text: `(มีภาพประกอบทั้งหมด ${treePhotoUrls.length} รูป)`, size: 'xs', color: '#aaaaaa', align: 'center', margin: 'md' });
  }

  const profileBubble = {
    type: 'bubble',
    body: { type: 'box', layout: 'vertical', contents: profileBody }
  };
  if (treePhotoUrl) {
    profileBubble.hero = {
      type: 'image', url: treePhotoUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover'
    };
  }
  bubbles.push(profileBubble);

  // 2. การ์ดประวัติ (Timeline Cards)
  if (harvestHistory && harvestHistory.length > 0) {
    harvestHistory.forEach(h => {
      const d = h.date ? new Date(h.date) : null;
      const dateStr = d ? `${d.getDate()} ${['\u0e21.\u0e04.','\u0e01.\u0e1e.','\u0e21\u0e35.\u0e04.','\u0e40\u0e21.\u0e22.','\u0e1e.\u0e04.','\u0e21\u0e34.\u0e22.','\u0e01.\u0e04.','\u0e2a.\u0e04.','\u0e01.\u0e22.','\u0e15.\u0e04.','\u0e1e.\u0e22.','\u0e18.\u0e04.'][d.getMonth()]} ${d.getFullYear()+543}` : '-';
      
      const eventPhotoUrls = h.photoUrl ? h.photoUrl.split(',') : [];
      const eventPhotoUrl = getDriveImageUrlForLine(eventPhotoUrls[0] || '');
      
      const historyBody = [
        { type: 'text', text: `\ud83d\udccb ${h.reason}`, weight: 'bold', size: 'md', color: h.reason === 'เสียหาย' ? '#e53935' : '#1DB446' },
        { type: 'text', text: dateStr, size: 'xs', color: '#888888', margin: 'sm' },
        { type: 'separator', margin: 'md' },
        {
          type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
          contents: [
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'จำนวน', color: '#888888', size: 'sm', flex: 3 },
              { type: 'text', text: `${h.quantity} ลูก`, size: 'sm', flex: 5, weight: 'bold' }
            ]}
          ]
        }
      ];

      // น้ำหนักคือข้อมูลหลักของการตัดขายในโมเดลใหม่ (คนสวนชั่งทีละต้น)
      if (h.weight) {
        historyBody[3].contents.push({
          type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'น้ำหนัก', color: '#888888', size: 'sm', flex: 3 },
            { type: 'text', text: `${h.weight} กก.`, size: 'sm', flex: 5, weight: 'bold' }
          ]
        });
      }

      // เกรดมีเฉพาะข้อมูลรุ่นเก่า — แถวใหม่เกรดอยู่ในชีต "รอบขาย" ระดับวัน
      // ไม่ใช่ระดับต้น (เทรวมกองแล้วคัด ตามกลับไม่ได้) จึงแสดงเฉพาะที่มีจริง
      if (h.reason === 'ตัดขาย' && h.grade && h.grade !== '-') {
        historyBody[3].contents.push({
          type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'เกรด', color: '#888888', size: 'sm', flex: 3 },
            { type: 'text', text: h.grade, size: 'sm', flex: 5 }
          ]
        });
      }

      if (eventPhotoUrls.length > 1) {
        historyBody.push({ type: 'text', text: `(มีภาพประกอบทั้งหมด ${eventPhotoUrls.length} รูป)`, size: 'xs', color: '#aaaaaa', align: 'center', margin: 'md' });
      }

      const historyBubble = {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', contents: historyBody }
      };

      if (eventPhotoUrl) {
        historyBubble.hero = {
          type: 'image', url: eventPhotoUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover'
        };
      }
      
      bubbles.push(historyBubble);
    });
  }

  // ถ้าเป็นการ์ดใบเดียว (ไม่มีประวัติ) ก็ส่งแค่ bubble
  if (bubbles.length === 1) {
    return {
      type: 'flex',
      altText: `\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e15\u0e49\u0e19\u0e17\u0e38\u0e40\u0e23\u0e35\u0e22\u0e19 ${treeInfo['\u0e23\u0e2b\u0e31\u0e2a\u0e15\u0e49\u0e19']}`,
      contents: bubbles[0]
    };
  }

  return {
    type: 'flex',
    altText: `\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e15\u0e49\u0e19\u0e17\u0e38\u0e40\u0e23\u0e35\u0e22\u0e19 ${treeInfo['\u0e23\u0e2b\u0e31\u0e2a\u0e15\u0e49\u0e19']}`,
    contents: {
      type: 'carousel',
      contents: bubbles
    }
  };
}

function buildPhotoRequestFlex(isRegisterFlow) {
  const flex = {
    type: 'flex',
    altText: 'กรุณาส่งรูปภาพ',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: '📸 ถ่ายรูปหรือเลือกรูปภาพ', weight: 'bold', size: 'lg' },
          { type: 'text', text: 'คุณสามารถส่งได้หลายรูป เมื่อส่งครบแล้วกรุณากดปุ่มด้านล่าง', wrap: true, color: '#666666', size: 'sm' }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1DB446',
            action: { type: 'message', label: 'ส่งรูปครบแล้ว', text: 'ส่งรูปครบแล้ว' }
          }
        ]
      }
    },
    quickReply: {
      items: [
        {
          type: 'action',
          action: { type: 'camera', label: 'ถ่ายรูป' }
        },
        {
          type: 'action',
          action: { type: 'cameraRoll', label: 'เลือกจากคลัง' }
        },
        {
          type: 'action',
          action: { type: 'message', label: 'ส่งรูปครบแล้ว', text: 'ส่งรูปครบแล้ว' }
        }
      ]
    }
  };

  if (isRegisterFlow) {
    flex.quickReply.items.push({
      type: 'action',
      action: { type: 'message', label: 'ข้าม (ไม่ส่งรูป)', text: 'ข้าม' }
    });
    flex.contents.footer.contents.push({
      type: 'button',
      style: 'secondary',
      action: { type: 'message', label: 'ข้าม', text: 'ข้าม' }
    });
  }

  return flex;
}

function buildHarvestReasonFlex(treeId) {
  return {
    type: 'flex',
    altText: 'เลือกเหตุผล',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'เลือกเหตุผลการเก็บเกี่ยว', weight: 'bold', size: 'lg' },
          { type: 'button', style: 'primary', margin: 'md', color: '#1DB446', action: { type: 'postback', label: 'ตัดขาย', data: `action=HARVEST_REASON&reason=ตัดขาย` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'เสียหาย', data: `action=HARVEST_REASON&reason=เสียหาย` } }
        ]
      }
    }
  };
}

// buildGradeSelectionFlex() ถูกลบออกแล้ว (2026-07-27)
// เดิมใช้ถามเกรดตอนคนสวนตัด แต่ตอนตัดยังไม่รู้เกรด ต้องเทรวมกองแล้วคัดขายก่อน
// เกรดจึงย้ายไปถามตอนบันทึกการขายรายวันแทน (ดู buildSaleRoundPromptFlex)
// ตัว handler `action=GRADE` ยังคงไว้ใน Code.gs เพื่อตอบปุ่มเก่าที่ค้างในแชท

function buildVarietySelectionFlex() {
  const createRow = (v1, v2) => ({
    type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'md',
    contents: [
      { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: v1, data: `action=VARIETY&variety=${v1}` } },
      { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: v2, data: `action=VARIETY&variety=${v2}` } }
    ]
  });

  return {
    type: 'flex',
    altText: 'เลือกสายพันธุ์',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'เลือกสายพันธุ์', weight: 'bold', size: 'lg' },
          createRow('หมอนทอง', 'ชะนี'),
          createRow('ก้านยาว', 'กระดุม'),
          createRow('พวงมณี', 'นกหยิบ'),
          { type: 'button', style: 'secondary', margin: 'md', action: { type: 'postback', label: 'อื่นๆ', data: `action=VARIETY&variety=อื่นๆ` } }
        ]
      }
    }
  };
}

function buildMonthSelectionFlex() {
  const createRow = (m1, m2, m3) => ({
    type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'md',
    contents: [
      { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: m1, data: `action=MONTH&month=${m1}` } },
      { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: m2, data: `action=MONTH&month=${m2}` } },
      { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: m3, data: `action=MONTH&month=${m3}` } }
    ]
  });

  return {
    type: 'flex',
    altText: 'เลือกเดือนออกดอก',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'เลือกเดือนออกดอก', weight: 'bold', size: 'lg' },
          createRow('ม.ค.', 'ก.พ.', 'มี.ค.'),
          createRow('เม.ย.', 'พ.ค.', 'มิ.ย.'),
          createRow('ก.ค.', 'ส.ค.', 'ก.ย.'),
          createRow('ต.ค.', 'พ.ย.', 'ธ.ค.')
        ]
      }
    }
  };
}

function buildHarvestSummaryFlex(data) {
  return {
    type: 'flex',
    altText: 'สรุปการเก็บเกี่ยว',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // ไม่มีเกรด/ราคาแล้ว — ตอนตัดยังไม่รู้ ต้องเทรวมกองแล้วคัดเกรดขายอีกที
          // เจ้าของจะบันทึกเกรด/ราคาทีเดียวตอนปิดยอดขายของวัน
          { type: 'text', text: 'ยืนยันการบันทึก', weight: 'bold', size: 'lg' },
          { type: 'text', text: `รหัสต้น: ${data.treeId}`, margin: 'md' },
          { type: 'text', text: `เหตุผล: ${data.reason}` },
          { type: 'text', text: `จำนวน: ${data.quantity} ลูก` },
          { type: 'text', text: `น้ำหนัก: ${data.weight ? data.weight + ' กก.' : '- (ไม่ได้ชั่ง)'}` }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: 'ยืนยัน', data: `action=CONFIRM&type=harvest` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ยกเลิก', data: `action=CANCEL` } }
        ]
      }
    }
  };
}

// ==========================================
// บันทึกการขายรายวัน (รอบขาย)
// ==========================================

/** หน้าแรก: สรุปยอดที่ตัดได้ของวัน + ขอให้กรอกเกรด/น้ำหนัก/ราคา */
function buildSaleRoundPromptFlex(summary, existing) {
  const lines = [
    { type: 'text', text: '📦 บันทึกการขาย', weight: 'bold', size: 'lg' },
    { type: 'text', text: 'วันที่ ' + formatRoundIdAsDate(summary.roundId), size: 'sm', color: '#79747E', margin: 'sm' },
    { type: 'separator', margin: 'md' },
    { type: 'text', text: `ตัดได้ ${summary.treeCount} ต้น · ${summary.totalCount} ลูก`, margin: 'md' },
    { type: 'text', text: `น้ำหนักรวมจากสวน: ${summary.totalWeight} กก.`, weight: 'bold' }
  ];

  if (summary.damagedCount > 0) {
    lines.push({ type: 'text', text: `(ผลเสียหาย ${summary.damagedCount} ลูก ไม่นับในการขาย)`, size: 'xs', color: '#B3261E' });
  }
  if (existing && existing.grades.length > 0) {
    lines.push({ type: 'separator', margin: 'md' });
    lines.push({ type: 'text', text: '⚠️ วันนี้บันทึกขายไว้แล้ว ' + existing.revenue.toLocaleString('th-TH') + ' บาท\nถ้าบันทึกใหม่จะทับของเดิม', size: 'xs', color: '#F9A825', wrap: true, margin: 'md' });
  }

  lines.push({ type: 'separator', margin: 'md' });
  lines.push({
    type: 'text', wrap: true, margin: 'md', size: 'sm',
    text: 'พิมพ์ผลการคัดเกรด บรรทัดละ 1 เกรด:\nเกรด น้ำหนัก ราคา/กก.\n\nตัวอย่าง:\nA 60 130\nB 40 90\nC 20 50'
  });

  return {
    type: 'flex',
    altText: 'บันทึกการขาย ' + formatRoundIdAsDate(summary.roundId),
    contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', contents: lines } }
  };
}

/** ยืนยันก่อนบันทึก — โชว์รวมเงินให้เห็นก่อนกด */
function buildSaleRoundConfirmFlex(roundId, grades) {
  let totalRevenue = 0, totalWeight = 0;
  const rows = grades.map(function (g) {
    const amount = g.weight * g.price;
    totalRevenue += amount;
    totalWeight += g.weight;
    return {
      type: 'box', layout: 'horizontal', margin: 'sm',
      contents: [
        { type: 'text', text: 'เกรด ' + g.grade, size: 'sm', flex: 3 },
        { type: 'text', text: g.weight + ' กก.', size: 'sm', flex: 3, align: 'end' },
        { type: 'text', text: '× ' + g.price, size: 'sm', flex: 3, align: 'end', color: '#79747E' },
        { type: 'text', text: amount.toLocaleString('th-TH'), size: 'sm', flex: 4, align: 'end', weight: 'bold' }
      ]
    };
  });

  return {
    type: 'flex',
    altText: 'ยืนยันการขาย',
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical',
        contents: [
          { type: 'text', text: 'ยืนยันการขาย', weight: 'bold', size: 'lg' },
          { type: 'text', text: 'วันที่ ' + formatRoundIdAsDate(roundId), size: 'sm', color: '#79747E' },
          { type: 'separator', margin: 'md' }
        ].concat(rows).concat([
          { type: 'separator', margin: 'md' },
          {
            type: 'box', layout: 'horizontal', margin: 'md',
            contents: [
              { type: 'text', text: 'รวม ' + totalWeight + ' กก.', size: 'sm', flex: 5 },
              { type: 'text', text: totalRevenue.toLocaleString('th-TH') + ' บาท', weight: 'bold', size: 'md', flex: 5, align: 'end', color: '#7CB342' }
            ]
          }
        ])
      },
      footer: {
        type: 'box', layout: 'horizontal',
        contents: [
          { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: 'ยืนยัน', data: 'action=SALE_CONFIRM' } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ยกเลิก', data: 'action=CANCEL' } }
        ]
      }
    }
  };
}

/** บันทึกเสร็จ — โชว์รายได้เฉลี่ยต่อ กก. ให้เห็นภาพ */
function buildSaleRoundSavedFlex(roundId, result, summary) {
  const avgPerKg = summary.totalWeight > 0 ? Math.round(result.totalRevenue / summary.totalWeight) : 0;
  return {
    type: 'flex',
    altText: 'บันทึกการขายเรียบร้อย',
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical',
        contents: [
          { type: 'text', text: '✅ บันทึกการขายเรียบร้อย', weight: 'bold', size: 'lg', color: '#1DB446', wrap: true },
          { type: 'text', text: 'วันที่ ' + formatRoundIdAsDate(roundId), size: 'sm', color: '#79747E', margin: 'sm' },
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'รายได้รวม ' + result.totalRevenue.toLocaleString('th-TH') + ' บาท', weight: 'bold', margin: 'md' },
          { type: 'text', text: 'น้ำหนักที่ขาย ' + result.totalWeight + ' กก.', size: 'sm' },
          { type: 'text', text: 'เฉลี่ย ' + avgPerKg.toLocaleString('th-TH') + ' บาท/กก.', size: 'sm', color: '#79747E' },
          { type: 'separator', margin: 'md' },
          { type: 'text', text: `ระบบเฉลี่ยรายได้กลับไปให้ ${summary.treeCount} ต้นที่ตัดวันนี้แล้ว (ตามสัดส่วนน้ำหนัก)`, size: 'xs', color: '#79747E', wrap: true, margin: 'md' }
        ]
      }
    }
  };
}

/**
 * คนสวน (หรือ role ที่ไม่ใช่เจ้าของ/admin) เปิด "บันทึกการขาย" ของรอบที่ตัวเอง
 * ส่งไปแล้วยังค้างอยู่ (รออนุมัติ หรือ ถูกส่งกลับแก้ไข) — โชว์สถานะแทนให้กรอกซ้ำ
 */
function buildSalePendingExistsFlex(roundId, pending, daysBack) {
  const isReturned = pending.status === 'ส่งกลับแก้ไข';
  const statusText = isReturned
    ? '⚠️ เจ้าของขอให้แก้ไข: ' + (pending.note || '-')
    : '⏳ ส่งไปแล้ว รอเจ้าของอนุมัติ';
  const grades = (pending.data && pending.data.grades) || [];
  const gradeLines = grades.map(function (g) {
    return `เกรด ${g.grade}: ${g.weight} กก. × ${g.price}`;
  }).join('\n');

  return {
    type: 'flex',
    altText: 'มีรายการขายค้างอยู่ ' + formatRoundIdAsDate(roundId),
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical',
        contents: [
          { type: 'text', text: '📦 มีรายการขายค้างอยู่แล้ว', weight: 'bold', size: 'lg', wrap: true },
          { type: 'text', text: 'วันที่ ' + formatRoundIdAsDate(roundId), size: 'sm', color: '#79747E', margin: 'sm' },
          { type: 'separator', margin: 'md' },
          { type: 'text', text: statusText, wrap: true, margin: 'md', color: isReturned ? '#B3261E' : '#79747E' },
          { type: 'text', text: gradeLines || '-', wrap: true, size: 'sm', margin: 'md' }
        ]
      },
      footer: {
        type: 'box', layout: 'horizontal',
        contents: [
          { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: 'แก้ไขรายการ', data: `action=SALE_ROUND&edit=1&days=${daysBack}` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ยกเลิก', data: `action=SALE_CANCEL_PENDING&id=${pending.id}` } }
        ]
      }
    }
  };
}

/** คนสวนส่งรายการขายเข้าคิวสำเร็จ — ย้ำชัดว่ายังไม่ใช่รายได้จริงจนกว่าเจ้าของจะอนุมัติ */
function buildSaleQueuedFlex(roundId, grades, buyer) {
  let totalRevenue = 0, totalWeight = 0;
  grades.forEach(function (g) { totalRevenue += g.weight * g.price; totalWeight += g.weight; });

  const lines = [
    { type: 'text', text: '📤 ส่งรายการขายให้เจ้าของอนุมัติแล้ว', weight: 'bold', size: 'lg', color: '#F9A825', wrap: true },
    { type: 'text', text: 'วันที่ ' + formatRoundIdAsDate(roundId), size: 'sm', color: '#79747E', margin: 'sm' },
    { type: 'separator', margin: 'md' },
    { type: 'text', text: 'รวม ' + totalWeight + ' กก. ประมาณ ' + totalRevenue.toLocaleString('th-TH') + ' บาท', weight: 'bold', margin: 'md' }
  ];
  if (buyer) lines.push({ type: 'text', text: 'ผู้ซื้อ: ' + buyer, size: 'sm', color: '#79747E' });
  lines.push({ type: 'separator', margin: 'md' });
  lines.push({ type: 'text', text: 'ยังไม่มีผลจนกว่าเจ้าของจะกดอนุมัติ — พิมพ์ "บันทึกการขาย" อีกครั้งถ้าอยากแก้ไขหรือยกเลิกรายการนี้', size: 'xs', color: '#79747E', wrap: true, margin: 'md' });

  return {
    type: 'flex',
    altText: 'ส่งรายการขายรออนุมัติแล้ว',
    contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', contents: lines } }
  };
}

function buildProductionSummaryFlex(data) {
  return {
    type: 'flex',
    altText: 'สรุปผลผลิต',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'ยืนยันจำนวนผลผลิต', weight: 'bold', size: 'lg' },
          { type: 'text', text: `รหัสต้น: ${data.treeId}`, margin: 'md' },
          { type: 'text', text: `จำนวนทั้งหมด: ${data.quantity} ลูก` }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: 'ยืนยัน', data: `action=CONFIRM&type=production` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ยกเลิก', data: `action=CANCEL` } }
        ]
      }
    }
  };
}

function buildTreeRegistrationSummaryFlex(data) {
  return {
    type: 'flex',
    altText: 'สรุปการลงทะเบียน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'ยืนยันการลงทะเบียนต้นไม้', weight: 'bold', size: 'lg' },
          { type: 'text', text: `(รหัสจะถูกสร้างหลังอนุมัติ)`, margin: 'md', color: '#aaaaaa' },
          { type: 'text', text: `พันธุ์: ${data.variety}` },
          { type: 'text', text: `อายุ: ${data.age} ปี` },
          { type: 'text', text: `เดือนออกดอก: ${data.flowerMonth}` }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: 'ยืนยัน', data: `action=CONFIRM&type=register` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ยกเลิก', data: `action=CANCEL` } }
        ]
      }
    }
  };
}

/**
 * แปลง JSON ในคิวรออนุมัติเป็นข้อความให้เจ้าของอ่านก่อนกดอนุมัติ
 *
 * เรียงตามลำดับที่คนอ่านต้องการเห็น: เหตุผล -> จำนวน -> น้ำหนัก
 * (น้ำหนักสำคัญขึ้นในโมเดลใหม่ เพราะเป็นฐานที่ใช้เฉลี่ยรายได้กลับไปหาต้น)
 *
 * `grade`/`price` ยังเช็คไว้เผื่อรายการเก่าที่ค้างในคิวข้ามการ deploy
 * แต่รายการใหม่จะไม่มี 2 ฟิลด์นี้แล้ว — เกรด/ราคาบันทึกตอนปิดยอดขายรายวัน
 */
function formatPendingData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    let result = '';
    if (data.reason) result += `สาเหตุ: ${data.reason}\n`;
    if (data.variety) result += `พันธุ์: ${data.variety}\n`;
    if (data.age) result += `อายุ: ${data.age} ปี\n`;
    if (data.flowerMonth) result += `เดือนออกดอก: ${data.flowerMonth}\n`;
    if (data.fruitCount) result += `จำนวน: ${data.fruitCount}\n`;
    if (data.quantity) result += `จำนวน: ${data.quantity} ลูก\n`;
    if (data.weight) result += `น้ำหนัก: ${data.weight} กก.\n`;
    if (data.roundId) result += `รอบวันที่: ${formatRoundIdAsDate(data.roundId)}\n`;
    // ---- เฉพาะรายการประเภท 'บันทึกขาย' (คนสวนส่งเข้าคิวรออนุมัติ) ----
    if (data.grades && data.grades.length) {
      result += 'เกรดที่กรอก:\n';
      data.grades.forEach(function (g) {
        result += `  ${g.grade}: ${g.weight} กก. × ${g.price} บาท/กก.\n`;
      });
    }
    if (data.buyer) result += `ผู้ซื้อ: ${data.buyer}\n`;
    // ---- เฉพาะรายการรุ่นเก่าที่ยังค้างในคิว ----
    if (data.grade) result += `เกรด: ${data.grade}\n`;
    if (data.price) result += `ราคา: ${data.price} บาท/กก.\n`;
    return result.trim() || '-';
  } catch(e) {
    return '-';
  }
}

function buildApprovalCarouselFlex(items) {
  const bubbles = items.map(item => {
    let requestDate = item['วันที่บันทึก'];
    let dateString = '-';
    if (requestDate) {
      try {
        dateString = Utilities.formatDate(new Date(requestDate), "Asia/Bangkok", "dd/MM/yyyy HH:mm");
      } catch(e) {
        dateString = requestDate.toString();
      }
    }

    // รายการประเภท 'บันทึกขาย' เก็บ roundId ไว้ในคอลัมน์ 'รหัสต้น' (คนละความหมาย
    // กับรายการอื่นที่เก็บรหัสต้นไม้จริง) โชว์เป็นวันที่ให้อ่านง่ายแทน
    const isSale = item['ประเภท'] === 'บันทึกขาย';
    const keyLabel = isSale ? 'รอบวันที่' : 'รหัสต้น';
    const keyValue = isSale ? formatRoundIdAsDate(item['รหัสต้น']) : item['รหัสต้น'];

    const footerButtons = [
      { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: 'อนุมัติ', data: `action=APPROVE&id=${item.ID}` } }
    ];
    // "ส่งกลับแก้ไข" มีความหมายเฉพาะรายการขาย (ผู้ส่งแก้ตัวเลขแล้ว submit ซ้ำได้)
    // รายการอื่น (ตัดจำหน่าย/ลงทะเบียน) ยังใช้แค่ อนุมัติ/ปฏิเสธ เหมือนเดิม
    if (isSale) {
      footerButtons.push({ type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ส่งกลับแก้ไข', data: `action=RETURN_START&id=${item.ID}` } });
    }
    footerButtons.push({ type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ปฏิเสธ', data: `action=REJECT_START&id=${item.ID}` } });

    const bubble = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `ประเภท: ${item['ประเภท']}`, weight: 'bold', size: 'md' },
          { type: 'text', text: `${keyLabel}: ${keyValue}` },
          { type: 'text', text: `ผู้บันทึก: ${item['บันทึกโดย']}` },
          { type: 'text', text: `วันที่ขอ: ${dateString}`, size: 'xs', color: '#888888' },
          { type: 'text', text: `รายละเอียด:\n${formatPendingData(item['ข้อมูล JSON'])}`, wrap: true, size: 'xs', margin: 'sm' }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: footerButtons
      }
    };

    // BUG FIX (พบระหว่างแก้จุดนี้): header จริงของคอลัมน์รูปในชีต 'คิวรออนุมัติ'
    // คือ 'รูปถ่าย URL' (ดู DatabaseSetup.gs) แต่โค้ดเดิมเช็ค item['รูปภาพ'] ซึ่ง
    // ไม่ตรงกับ header ไหนเลย -> รูป hero การ์ดอนุมัติไม่เคยขึ้นเลยตั้งแต่แรก
    if (item['รูปถ่าย URL']) {
      const imgUrl = item['รูปถ่าย URL'].split(',')[0].trim();
      if (imgUrl.startsWith('http')) {
        bubble.hero = {
          type: 'image',
          url: imgUrl,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover'
        };
      }
    }

    return bubble;
  });

  return {
    type: 'flex',
    altText: 'รายการรออนุมัติ',
    contents: {
      type: 'carousel',
      contents: bubbles
    }
  };
}

function buildDashboardMenuFlex() {
  return {
    type: 'flex',
    altText: 'แดชบอร์ด',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'เลือกรายงาน', weight: 'bold', size: 'lg' },
          { type: 'button', style: 'primary', margin: 'md', color: '#1DB446', action: { type: 'postback', label: 'สรุปภาพรวม', data: `action=DASHBOARD_VIEW&type=total` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'แยกตามสายพันธุ์', data: `action=DASHBOARD_VIEW&type=variety` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'แยกตามเกรด', data: `action=DASHBOARD_VIEW&type=grade` } },
          // "บันทึกการขายวันนี้" ย้ายขึ้นไปเป็นปุ่มหลักบน Rich Menu แล้ว จึงไม่ซ้ำที่นี่
          // เหลือไว้เฉพาะ "เมื่อวาน" ซึ่งใช้นานๆ ครั้ง ไม่คุ้มกินช่องบน Rich Menu
          { type: 'separator', margin: 'lg' },
          { type: 'button', style: 'link', margin: 'sm', height: 'sm', action: { type: 'postback', label: '📦 บันทึกการขายของเมื่อวาน', data: `action=SALE_ROUND&days=1` } }
        ]
      }
    }
  };
}

/**
 * การ์ด "ระบบจัดการ" — ประตูเข้าเว็บ Dashboard แยกตามแท็บ
 *
 * ทำเป็นการ์ดแทนที่จะเป็นปุ่มบน Rich Menu หลายปุ่ม เพราะ:
 *   1) Rich Menu มีช่องจำกัด และการเพิ่มปุ่มต้องทำรูปใหม่ทั้งใบทุกครั้ง
 *   2) เพิ่มแท็บใหม่ในอนาคตแค่เพิ่มปุ่มตรงนี้ ไม่ต้องยุ่งกับรูปเลย
 *
 * ต้องส่ง webAppUrl เข้ามา (ScriptApp.getService().getUrl()) เพราะ FlexMessages
 * ไม่ควรไปเรียก service เอง — ให้ผู้เรียกที่รู้ context เป็นคนหามา
 */
function buildManageMenuFlex(webAppUrl) {
  const link = function (tab) { return webAppUrl + '?page=dashboard&tab=' + tab; };

  const items = [
    { label: '🌳 จัดการต้นไม้', tab: 'trees' },
    { label: '💰 รายได้', tab: 'income' },
    { label: '🗺️ แผนที่สวน', tab: 'map' },
    { label: '📋 รายการรออนุมัติ', tab: 'pending' },
    { label: '👥 ผู้ใช้งาน', tab: 'users' }
  ];

  return {
    type: 'flex',
    altText: 'ระบบจัดการ',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '⚙️ ระบบจัดการ', weight: 'bold', size: 'lg' },
          { type: 'text', text: 'เปิดหน้าเว็บไปที่หัวข้อที่ต้องการ', size: 'xs', color: '#79747E', margin: 'sm' },
          { type: 'separator', margin: 'md' }
        ].concat(items.map(function (it, i) {
          return {
            type: 'button',
            style: i === 0 ? 'primary' : 'secondary',
            color: i === 0 ? '#7CB342' : undefined,
            margin: i === 0 ? 'md' : 'sm',
            action: { type: 'uri', label: it.label, uri: link(it.tab) }
          };
        }))
      }
    }
  };
}

/**
 * @param {string} unit หน่วยที่ต่อท้ายตัวเลข เช่น 'ลูก' หรือ 'กก.'
 *                      เว้นว่างสำหรับ "สรุปภาพรวม" ที่มีหน่วยติดมากับค่าอยู่แล้ว
 */
function buildDashboardResultFlex(title, data, unit) {
  const contents = [
    { type: 'text', text: title, weight: 'bold', size: 'lg' }
  ];
  
  for (const [key, value] of Object.entries(data)) {
    // ใส่หน่วยกำกับ เพราะ "สรุปตามเกรด" เปลี่ยนจากนับลูกเป็นชั่ง กก. แล้ว
    // (เกรดมาจากผลคัดจริงตอนขาย ซึ่งชั่งเป็นกิโล ไม่ได้นับลูก)
    const suffix = (unit && key !== 'ยังไม่มีข้อมูล') ? ' ' + unit : '';
    contents.push({ type: 'text', text: `${key}: ${value}${suffix}`, margin: 'sm' });
  }

  return {
    type: 'flex',
    altText: 'รายงาน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: contents
      }
    }
  };
}

function buildTextPromptFlex(question) {
  return {
    type: 'text',
    text: question
  };
}

function buildLocationRequestFlex() {
  return {
    type: 'text',
    text: 'กรุณากดปุ่มด้านล่างเพื่อส่งตำแหน่ง (Location) ของต้นไม้ครับ 📍',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'location',
            label: 'แชร์ตำแหน่งที่ตั้ง'
          }
        }
      ]
    }
  };
}

function buildPhotoRequestFlex(message, showSkip) {
  const msg = message || 'กรุณาถ่ายรูปแล้วส่งมาได้เลยครับ 📸';
  const obj = { type: 'text', text: msg };
  if (showSkip) {
    obj.quickReply = {
      items: [{ type: 'action', action: { type: 'message', label: 'ข้าม (ไม่ส่งรูป)', text: 'ข้าม' } }]
    };
  }
  return obj;
}

function buildSuccessFlex(message) {
  return {
    type: 'text',
    text: `✅ ${message}`
  };
}

function buildErrorFlex(message) {
  return {
    type: 'text',
    text: `❌ ${message}`
  };
}
