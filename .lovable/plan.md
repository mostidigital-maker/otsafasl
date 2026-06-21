# תוכנית: מערכת הזמנת תורים + לוח בקרה + מיילים רב-לשוניים

## 1. הפעלת תשתית
- הפעלת **Lovable Cloud** (מסד נתונים, אימות, edge functions)
- הקמת מערכת מיילים של Lovable (דורש דומיין שליחה)
- שינוי שפת ברירת מחדל ל**ערבית** (כבר ככה, אוודא ב-LanguageContext)

## 2. מסד נתונים
טבלאות:
- `locations` — באר שבע, מעיליא (seed)
- `working_hours` — לכל מיקום: יום בשבוע, שעת התחלה/סיום, משך תור (ברירת מחדל 45 דק׳)
- `blocked_slots` — חסימות ידניות / חופשות שהאדמין מוסיף
- `appointments` — child_name, child_age, parent_name, phone, email, language (ar/he/en), location_id, slot_datetime, status (pending/confirmed/cancelled), notes, created_at
- `profiles` + `user_roles` (enum: admin) — לפי best practice; פונקציית `has_role` SECURITY DEFINER
- RLS:
  - יצירת appointment פתוחה לכל אחד (אורח)
  - קריאה/עדכון של appointments, working_hours, blocked_slots — admin בלבד
  - locations + working_hours — קריאה ציבורית (כדי לחשב slots)

## 3. זרימת הזמנה ללקוח
טופס הזמנה משופר:
1. בחירת **מיקום** (באר שבע / מעיליא)
2. **לוח שנה** עם חודש קדימה — ימים עם שעות פעילות זמינים
3. בחירת **תאריך** → הצגת **שעות פנויות** (מחושב מ-working_hours פחות תורים תפוסים פחות חסימות)
4. מילוי פרטים: שם ילד, גיל, שם הורה, טלפון, **אימייל**
5. שליחה → סטטוס pending → מייל "ההזמנה התקבלה" בשפת הלקוח

## 4. לוח בקרה לאדמין (`/admin`)
- כניסה עם אימייל/סיסמה
- **תורים**: רשימה + סינון לפי תאריך/מיקום/סטטוס; כפתורי אישור/ביטול
  - אישור → סטטוס confirmed → מייל "התור אושר" עם תאריך/שעה/מיקום בשפת הלקוח
- **הוספת תור ידני** (לטלפוניים): טופס שיוצר appointment שחוסם את השעה
- **שעות פעילות**: עריכה לפי מיקום ויום
- **חסימות**: הוספה/מחיקה של slots ידניים (חופש, חג)

## 5. מיילים (3 שפות)
Edge function `send-appointment-email`:
- תבניות React Email: `appointment-received`, `appointment-confirmed` × ar/he/en
- שפה נבחרת לפי `language` שנשמרת ב-appointment (מה-LanguageContext בעת ההזמנה)
- RTL לערבית/עברית, LTR לאנגלית
- נשלח אוטומטית: ביצירת תור + בעדכון סטטוס ל-confirmed

## 6. שלבי ביצוע
1. Enable Cloud + email infra + domain setup dialog
2. Migrations: schema + RLS + seed locations + default working hours
3. דף `/auth` ל-admin + `/admin/*` עם הגנת תפקיד
4. Refactor `BookingSection` למסך רב-שלבי (מיקום → תאריך → שעה → פרטים)
5. Hook לחישוב slots פנויים
6. Admin dashboard pages
7. Edge function למיילים + תבניות
8. חיבור triggers (יצירה / שינוי סטטוס)

## הערות
- לפני שאני מתחיל: צריך **דומיין למיילים** (תופיע הנחיה אוטומטית)
- אצור משתמש אדמין ראשון דרך דף `/auth` — תצטרכי להירשם ואני אעניק תפקיד admin ידנית (אגיד לך איך)
- WhatsApp נשאר כפי שהוא (כפתור) — אם רוצה גם הודעות WhatsApp אוטומטיות אחרי המייל, נוסיף בהמשך (דורש Twilio/WhatsApp Business API)

מאשרת להתחיל?
