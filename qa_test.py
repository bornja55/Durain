import requests
import json
import time

# ==========================================
# 🧪 QA Testing Script for Durian Farm LINE Bot
# ==========================================
# วิธีใช้งาน:
# 1. นำ URL ของ Web App (ที่ได้จากตอน Deploy) มาใส่ใน WEBHOOK_URL
# 2. กดรันสคริปต์นี้เพื่อจำลองการส่งข้อความจากผู้ใช้ผ่าน LINE
# ==========================================

WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxny2W1pyc9Ba7H0RmilP7mC92tUScmSONwVOuUG_NgHlzzaaDQcYqKoNW17ikgeAzO/exec"
MOCK_USER_ID = "U_MOCK_TEST_USER_9999"

def send_mock_event(event_type, message_type=None, text=None, postback_data=None):
    event = {
        "type": event_type,
        "replyToken": f"dummy_token_{int(time.time())}",
        "source": {
            "userId": MOCK_USER_ID,
            "type": "user"
        },
        "timestamp": int(time.time() * 1000)
    }

    if event_type == "message" and message_type == "text":
        event["message"] = {
            "id": f"msg_{int(time.time())}",
            "type": "text",
            "text": text
        }
    elif event_type == "postback":
        event["postback"] = {
            "data": postback_data
        }

    payload = {
        "destination": "U_BOT_ID_DUMMY",
        "events": [event]
    }

    print(f"\n[🚀] Sending {event_type} event", f"-> {text or postback_data}" if text or postback_data else "")
    try:
        response = requests.post(
            WEBHOOK_URL, 
            json=payload,
            headers={"Content-Type": "application/json"},
            allow_redirects=False
        )
        print(f"[✅] Response Status: {response.status_code}")
        print(f"[✅] Response Body: {response.text}")
    except Exception as e:
        print(f"[❌] Error: {e}")

def run_tests():
    print("====================================")
    print("   เริ่มการทดสอบระบบ (QA Tests)   ")
    print("====================================")

    if "YOUR_SCRIPT_ID" in WEBHOOK_URL:
        print("⚠️ กรุณาแก้ไขตัวแปร WEBHOOK_URL ในไฟล์ qa_test.py ก่อนรันสคริปต์")
        return

    # 1. ทดสอบเหตุการณ์ Follow (แอดบอทครั้งแรก)
    send_mock_event("follow")
    time.sleep(2)

    # 2. ทดสอบจำลองการสแกน QR Code เพื่อลงทะเบียนต้นไม้
    send_mock_event("message", message_type="text", text="SCAN:register:NEW")
    time.sleep(2)

    # 3. ทดสอบจำลองการสแกน QR Code เพื่ออัปเดตผลผลิต (ต้น T-0001)
    send_mock_event("message", message_type="text", text="SCAN:yield:T-0001")
    time.sleep(2)

    # 4. ทดสอบพิมพ์ข้อความยกเลิก (Cancel)
    send_mock_event("postback", postback_data="action=cancel")
    time.sleep(2)

    # 5. ทดสอบจำลองการสแกน QR Code เพื่อเข้าสู่กระบวนการเก็บเกี่ยว (ตัดจำหน่าย/เสียหาย)
    send_mock_event("message", message_type="text", text="SCAN:harvest:T-0001")
    time.sleep(2)

    # 6. ทดสอบจำลองการกดปุ่ม "ตัดขาย" (Harvest)
    send_mock_event("postback", postback_data="action=HARVEST_REASON&reason=ตัดขาย")
    time.sleep(2)

    # 7. ทดสอบกดปุ่มยกเลิก และสแกนเก็บเกี่ยวอีกครั้ง เพื่อจำลอง "เสียหาย"
    send_mock_event("postback", postback_data="action=cancel")
    time.sleep(2)
    send_mock_event("message", message_type="text", text="SCAN:harvest:T-0001")
    time.sleep(2)
    send_mock_event("postback", postback_data="action=HARVEST_REASON&reason=เสียหาย")
    time.sleep(2)

    print("\n====================================")
    print("   การทดสอบเสร็จสิ้น 🎉            ")
    print("====================================")
    print("โปรดตรวจสอบผลการทำงานได้ใน Google Sheets หรือ Executions Log ของ GAS")

if __name__ == "__main__":
    run_tests()
