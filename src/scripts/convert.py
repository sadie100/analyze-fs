import xml.etree.ElementTree as ET
import json

# XML 파일 파싱
tree = ET.parse('CORPCODE.xml')
root = tree.getroot()

# 결과 딕셔너리 생성
companies = {}

# XML에서 필요한 데이터 추출
for item in root.findall('.//list'):
    corp_name = item.find('corp_name').text
    companies[corp_name] = {
        "corp_code": item.find('corp_code').text,
        "stock_code": item.find('stock_code').text.strip(),
        "modify_date": item.find('modify_date').text
    }

# JSON 파일로 저장
with open('companies.json', 'w', encoding='utf-8') as f:
    json.dump(companies, f, ensure_ascii=False, indent=2)

print('변환 완료!')