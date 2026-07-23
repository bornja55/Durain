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

      if (h.reason === 'ตัดขาย') {
        historyBody[3].contents.push({
          type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'เกรด', color: '#888888', size: 'sm', flex: 3 },
            { type: 'text', text: h.grade || '-', size: 'sm', flex: 5 }
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

function buildGradeSelectionFlex() {
  return {
    type: 'flex',
    altText: 'เลือกเกรด',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'เลือกเกรดผลผลิต', weight: 'bold', size: 'lg' },
          { type: 'button', style: 'primary', margin: 'md', color: '#1DB446', action: { type: 'postback', label: 'เกรด A', data: `action=GRADE&grade=A` } },
          { type: 'button', style: 'primary', margin: 'sm', color: '#1DB446', action: { type: 'postback', label: 'เกรด B', data: `action=GRADE&grade=B` } },
          { type: 'button', style: 'primary', margin: 'sm', color: '#1DB446', action: { type: 'postback', label: 'เกรด C', data: `action=GRADE&grade=C` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ตกไซซ์', data: `action=GRADE&grade=ตกไซซ์` } }
        ]
      }
    }
  };
}

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
          { type: 'text', text: 'ยืนยันการบันทึก', weight: 'bold', size: 'lg' },
          { type: 'text', text: `รหัสต้น: ${data.treeId}`, margin: 'md' },
          { type: 'text', text: `จำนวน: ${data.quantity} ลูก` },
          { type: 'text', text: `เหตุผล: ${data.reason}` },
          { type: 'text', text: `เกรด: ${data.grade || '-'}` },
          { type: 'text', text: `น้ำหนัก: ${data.weight || '-'} กก.` },
          { type: 'text', text: `ราคา: ${data.price || '-'} บาท/กก.` }
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

function formatPendingData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    let result = '';
    if (data.variety) result += `พันธุ์: ${data.variety}\n`;
    if (data.age) result += `อายุ: ${data.age} ปี\n`;
    if (data.flowerMonth) result += `เดือนออกดอก: ${data.flowerMonth}\n`;
    if (data.fruitCount) result += `จำนวน: ${data.fruitCount}\n`;
    if (data.quantity) result += `จำนวน(ดอก/ลูก): ${data.quantity}\n`;
    if (data.grade) result += `เกรด: ${data.grade}\n`;
    if (data.weight) result += `น้ำหนัก: ${data.weight} กก.\n`;
    if (data.reason) result += `สาเหตุ: ${data.reason}\n`;
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
    
    const bubble = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `ประเภท: ${item['ประเภท']}`, weight: 'bold', size: 'md' },
          { type: 'text', text: `รหัสต้น: ${item['รหัสต้น']}` },
          { type: 'text', text: `ผู้บันทึก: ${item['บันทึกโดย']}` },
          { type: 'text', text: `วันที่ขอ: ${dateString}`, size: 'xs', color: '#888888' },
          { type: 'text', text: `รายละเอียด:\n${formatPendingData(item['ข้อมูล JSON'])}`, wrap: true, size: 'xs', margin: 'sm' }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'button', style: 'primary', color: '#1DB446', action: { type: 'postback', label: 'อนุมัติ', data: `action=APPROVE&id=${item.ID}` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'ปฏิเสธ', data: `action=REJECT_START&id=${item.ID}` } }
        ]
      }
    };
    
    if (item['รูปภาพ']) {
      const imgUrl = item['รูปภาพ'].split(',')[0].trim();
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
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'แยกตามเกรด', data: `action=DASHBOARD_VIEW&type=grade` } }
        ]
      }
    }
  };
}

function buildDashboardResultFlex(title, data) {
  const contents = [
    { type: 'text', text: title, weight: 'bold', size: 'lg' }
  ];
  
  for (const [key, value] of Object.entries(data)) {
    contents.push({ type: 'text', text: `${key}: ${value}`, margin: 'sm' });
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
