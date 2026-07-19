function buildTreeInfoFlex(treeInfo, remaining) {
  return {
    type: 'flex',
    altText: 'ข้อมูลต้นทุเรียน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'ข้อมูลต้นทุเรียน', weight: 'bold', size: 'xl', color: '#1DB446' },
          { type: 'text', text: `รหัสต้น: ${treeInfo['รหัสต้น']}`, margin: 'md' },
          { type: 'text', text: `พันธุ์: ${treeInfo['พันธุ์']}` },
          { type: 'text', text: `ผลผลิตคงเหลือ: ${remaining} ลูก`, weight: 'bold', color: '#ff0000' }
        ]
      }
    }
  };
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
          { type: 'button', style: 'primary', margin: 'md', color: '#1DB446', action: { type: 'postback', label: 'หมอนทอง', data: `action=VARIETY&variety=หมอนทอง` } },
          { type: 'button', style: 'primary', margin: 'sm', color: '#1DB446', action: { type: 'postback', label: 'ชะนี', data: `action=VARIETY&variety=ชะนี` } },
          { type: 'button', style: 'primary', margin: 'sm', color: '#1DB446', action: { type: 'postback', label: 'ก้านยาว', data: `action=VARIETY&variety=ก้านยาว` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'อื่นๆ', data: `action=VARIETY&variety=อื่นๆ` } }
        ]
      }
    }
  };
}

function buildMonthSelectionFlex() {
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
          { type: 'button', style: 'primary', margin: 'md', color: '#1DB446', action: { type: 'postback', label: 'ม.ค.', data: `action=MONTH&month=ม.ค.` } },
          { type: 'button', style: 'primary', margin: 'sm', color: '#1DB446', action: { type: 'postback', label: 'ก.พ.', data: `action=MONTH&month=ก.พ.` } },
          { type: 'button', style: 'primary', margin: 'sm', color: '#1DB446', action: { type: 'postback', label: 'มี.ค.', data: `action=MONTH&month=มี.ค.` } },
          { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'postback', label: 'อื่นๆ', data: `action=MONTH&month=อื่นๆ` } }
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
          { type: 'text', text: `รหัสต้น: ${data.treeId}`, margin: 'md' },
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

function buildApprovalCarouselFlex(items) {
  const bubbles = items.map(item => {
    return {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `ประเภท: ${item['ประเภท']}`, weight: 'bold', size: 'md' },
          { type: 'text', text: `รหัสต้น: ${item['รหัสต้น']}` },
          { type: 'text', text: `ผู้บันทึก: ${item['บันทึกโดย']}` },
          { type: 'text', text: `รายละเอียด: ${item['ข้อมูล JSON']}`, wrap: true, size: 'xs', margin: 'sm' }
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
    text: 'กรุณาส่งตำแหน่งของต้นไม้ (Location)'
  };
}

function buildPhotoRequestFlex() {
  return {
    type: 'text',
    text: 'กรุณาส่งรูปภาพ (หรือพิมพ์ "ข้าม" เพื่อดำเนินการต่อ)'
  };
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
