import os
import json
import urllib.request
import base64

api_key = ''
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY='):
            api_key = line.split('=', 1)[1].strip()

sample_img = os.path.join(os.path.dirname(__file__), '..', '..', 'uploads', 'MK-72D3A3', '1788775661746-f936c3b9.jpg')
with open(sample_img, 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')

prompt = "Extract structured JSON: documentType, patient, facility, prescription (medicines: medicineName, dosage, frequency, instructions)"
payload = {
    "contents": [{
        "parts": [
            {"text": prompt},
            {"inline_data": {"mime_type": "image/jpeg", "data": b64_data}}
        ]
    }],
    "generationConfig": {
        "response_mime_type": "application/json"
    }
}

models = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash"]
for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode('utf-8'))
            text = res_data['candidates'][0]['content']['parts'][0]['text']
            print(f"SUCCESS with {model}:")
            print(text)
            break
    except Exception as e:
        print(f"FAILED with {model}: {e}")
