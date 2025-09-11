// src/data/topics.js
import xbrlImg from "../assets/xbrl.png";
import xbrlIntroImg from "../assets/introxbrl.png";
import shareData from "../assets/sharedata1.jpg";
import xbrlDo from "../assets/xbrldo.svg";
import shirtImg from "../assets/tshirt.png";
import instanceTax from "../assets/instance-taxonomy.png";
import xbrlWorking from "../assets/HOW-DOES-XBRL-WORK.webp";
import instanceImg from "../assets/instance.png";
import taxonomyImg from "../assets/linkbases.png"
export const topics = [
  {
    id: 1,
    title: "Understanding the Basics",
    summary: "Learn what XBRL is, why it matters, and its advantages.",
    image: xbrlImg,
    content: [
      // What is XBRL?
      {
        type: "knowledge",
        title: "What is XBRL?",
        image: "",
        text: `
👋 Hi, I’m Jerry!  
📘 XBRL stands for eXtensible Business Reporting Language.

- It’s a smart language 🤖 that helps computers read and exchange business 📊 and financial 💰 data.

- Companies use XBRL to tag 🏷️ key facts like "Net Profit", so software can read 📥 and compare 📈 reports automatically!

📜 XBRL was invented in the late 1990s to modernize reporting — from paper to digital data!
    `.trim(),
      },
      {
        type: "quiz",
        question: "📘 What does XBRL stand for?",
        options: [
          "eXtensible Business Reporting Language",
          "Extra Business Reporting Logic",
          "Xtra Big Reporting List",
          "XML-Based Real-time Ledger",
        ],
        correctIndex: 0,
      },
      {
        type: "knowledge",
        title: "Shirt Analogy",
        image: shirtImg,
        imageSize: "large",
        text: `
🧥 Imagine you're buying a shirt.

---

🧵 **Problem Before Standards**  
Each brand had its own idea of "Medium":  
- One Medium fits like a Small 😟  
- Another like a Large 😮  
It was confusing for both buyers and sellers.
---

✅ **Solution: Standardized Tagging**  
Now every shirt has standardized tags:  
- Size: M  
- Brand: Levi's  
- Fit: Regular  
- Color: Blue  

These tags help **compare and sort shirts correctly**, regardless of brand.
  `.trim(),
      },
      {
        type: "knowledge",
        title: "🧾 How XBRL Works",
        image: xbrlDo,
        imageSize: "special",
        text: `
In XBRL, **every number is tagged** — just like shirts have size, color, and brand tags.

🧠 This helps software understand **what** a number means, **when** it's from, and **who** it belongs to.

---

📊 **Example: Cash = ₹80,00,000**

That number alone isn’t enough. But XBRL adds **tags** that provide full context:

- **Concept**: What this number is → \`CashAndCashEquivalents\`
- **Entity**: Who it belongs to → \`IRIS\`
- **Unit**: Currency → \`INR\`
- **Period**: Date → \`31-12-2022\`
- **Language**: Text language → \`en\`

---

✅ **Conditions & Checks**:
- \`Cash = Cash in Hand + Cash in Bank\`
- \`Cash ≥ 0\` (no negative cash allowed)

---

📌 **Why It Matters**:

> This tells you how much **ready money** 💵 the company **IRIS** had on **31 Dec 2022**.  
> And because it's in **XBRL**, software can **read**, **validate**, and **compare** it — instantly and reliably!
`.trim(),
      },
      {
        type: "knowledge",
        title: "XBRL",
        image: xbrlIntroImg,
        imageSize: "large",
        text: `
📘 **What is XBRL?**

- XBRL is an *open, free* standard for business reporting 🌐📊  
- It lets companies make, share, and publish info online using tags (like labels for data) 🏷️💬  
- It’s built on XML, so computers can instantly “read” numbers, dates, and context 🖥️📅🔢  
- *Does not* change accounting rules — it just makes reporting **smarter and faster**! ⚖️🚀  
- You can even create **custom tags** for your unique business facts 🧩✍️
  `.trim(),
      },

      {
        type: "quiz",
        question: "🤖 Why is XBRL considered a smart language?",
        options: [
          "Because it uses artificial intelligence",
          "Because it helps computers read and exchange business data",
          "Because it replaces accounting software",
          "Because it’s only used by smart companies",
        ],
        correctIndex: 1,
      },
      {
        type: "quiz",
        question: "🏷️ What kind of data can be tagged using XBRL?",
        options: [
          "Emojis and images",
          "Programming code",
          "Key business facts like 'Net Profit'",
          "Only legal documents",
        ],
        correctIndex: 2,
      },
      // Why it matters
      {
        type: "knowledge",
        title: "Why does XBRL matter?",
        image: shareData,
        imageSize: "small",
        text: `
📈 XBRL helps **companies, investors, and governments** share financial data quickly & accurately.
- ✅ Makes reports easy to compare
- ⏰ Saves everyone time
- ❌ Reduces errors
- 🤝 Builds trust in numbers

That’s why regulators like the SEC require XBRL filings!
    `.trim(),
      },
      {
        type: "knowledge",
        title: "Advantages of XBRL",
        text: `
**🔥XBRL's superpowers:**
- 🔄 **Reusable Data**: Data entered once can be reused across reports, tools, and agencies.
- ✅ **Auto Validation**: Errors are caught right when data is created—no last-minute surprises!
- 🧩 **Custom + Standard Tags**: Use global standards, or add your own for special cases.
- 🌍 **Works Across Systems**: Whether it's banks, regulators, or companies—everyone understands XBRL.
- 📈 **Better Investment Decisions**: Clean, comparable data helps investors make smart calls.
- 🌐 **Multilingual**: Reports can be read in many languages—faster adoption worldwide!

🙌 Less manual work, fewer mistakes, and more trust in your data!
  `.trim(),
      },
      {
        type: "quiz",
        question:
          "Why do regulatory agencies like the SEC mandate the use of XBRL for financial filings?",
        options: [
          "To increase the length and complexity of financial reports",
          "To challenge traditional accounting workflows without added benefit",
          "Because it reflects outdated regulatory practices",
          "To make financial data machine-readable and easily comparable across entities",
        ],
        correctIndex: 3,
      },
      {
        type: "quiz",
        question:
          "Which is NOT a benefit of using XBRL in financial reporting?",
        options: [
          "Enables seamless data exchange across systems",
          "Improves comparability between companies",
          "Increases the complexity of physical document handling",
          "Reduces human errors through automated validation",
        ],
        correctIndex: 2,
      },
      {
        type: "quiz",
        question: "Who can use XBRL reports?",
        options: ["Regulators", "Investors", "Auditors", "All of the above"],
        correctIndex: 3,
      },
      {
        type: "quiz",
        question:
          "Which of the following best explains XBRL's 'Custom + Standard Tags' feature?",
        options: [
          "Only company-specific tags can be used",
          "You can use both global standards and your own tags",
          "Only international tags are allowed",
          "Tags must be selected from a fixed list",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 2,
    title: "Core Concepts and Components",
    summary: "Explore elements, taxonomies, linkbases, and instance documents.",
    image: xbrlImg,
    content: [
      {
        type: "knowledge",
        title: "🔖 What is a Concept?",
        image: "concept_img",
        imageSize: "medium",
        text: `
👕 **Analogy: Shirt Sizes**

👚 Just like **"Size"** is a defined label for clothes,  
💵 **"Revenue"** is a defined tag in XBRL.

---

In **XBRL**, a *concept* is like a **defined tag** for a business item — such as "Cash", "Revenue", or "Net Profit".

- To define a concept in XBRL, we use **XSD (XML Schema Definition)**.  
- Each concept is an XML element with properties like type, balance, periodType.

✅ **This is how Concept is defined in Taxonomy**:
\`\`\`xml
<element name="Revenue"
         id="el_Revenue"
         type="xbrli:monetaryItemType"
         periodType="duration"
         balance="credit"/>
\`\`\`

📌 This tells XBRL software:
- What the tag \`<Revenue>\` means
- That it's a **monetary** value
- It applies to a **period** (eg.1 year)
- It’s a **credit**-type account

Concepts are defined in the **taxonomy**, so computers know:
- What each tag means
- What kind of data it holds
- How it behaves
`.trim(),
      },
      {
        type: "knowledge",
        title: "📊 What is a Fact?",
        image: "fact_img",
        imageSize: "medium",
        text: `
👕 Just like a shirt has a tag saying **“Size: Large”**,  
🏢 a company report has a tag saying **“Revenue: 5,000,000 USD”**.

---

A **fact** is the *actual reported value* tied to a concept.  

✅ Example Fact in Instance:
\`\`\`xml
<Revenue contextRef="c1" unitRef="u1" decimals="0">
  5000000
</Revenue>
\`\`\`

📌 This tells us:
- The **value** → 5,000,000  
- The **concept** → Revenue  
- The **period**, **unit**, and **context** → c1, u1, etc.

💬 Think of it like: “Revenue was **5,000,000 USD** in 2024.”
Facts are stored in the **instance document** using tags defined in the taxonomy.

`.trim(),
      },
      {
        type: "knowledge",
        title: "📚 What is a Taxonomy?",
        image: "taxonomy_img",
        imageSize: "medium",
        text: `
  #### 📂 Taxonomy = Dictionary + Rules
A **taxonomy** is like a **dictionary or blueprint** for XBRL.  
It defines the meanings of each concept, rules and relationships used in financial reporting.

📘 Think of it as the guide for creating valid, structured data.

✅ A taxonomy includes:
- 📌**Concepts (Elements):** Like "Revenue" or "Assets"
- 📌**Relationships:** How concepts relate (e.g., summation or hierarchy)
- 📌**Labels:** Human-readable names
- 📌**References:** Source documents (like IFRS or GAAP)
- 📌**Dimensions:** To slice data by Region, Time, Product, etc.

📝 Taxonomy is created by regulators (like SEC, MCA, etc.) or companies.
`.trim(),
      },
      {
        type: "knowledge",
        title: "📄 What is an Instance Document?",
        image: xbrlWorking,
        imageSize: "large",
        text: `
An **instance document** is the actual **financial report** submitted by a company using XBRL.  
It uses tags from the taxonomy to report **facts** (real values).

💡 It’s like a filled-in form — valid only if the tags are defined in the taxonomy.

📘 Summary:
- Taxonomy = defines **concepts**
- Instance = reports **facts**
`.trim(),
      },
      {
        type: "quiz",
        question: "📘 What is the primary purpose of a Taxonomy in XBRL?",
        options: [
          "To store financial facts like revenue or profit",
          "To display data in a user-friendly format",
          "To define the structure and meaning of financial data",
          "To validate the identity of reporting companies",
        ],
        correctIndex: 2,
        explanation:
          "A taxonomy defines concepts, relationships, and rules for how facts are reported in XBRL.",
      },
      {
        type: "quiz",
        question:
          "🗒️ Which of the following is typically found inside an XBRL Instance Document?",
        options: [
          "Definitions of concepts like Assets and Revenue",
          "Facts like Net Profit for 2024",
          "Presentation relationships",
          "Validation rules for elements",
        ],
        correctIndex: 1,
        explanation:
          "An XBRL Instance Document reports actual business data (facts), while definitions and rules are in the taxonomy document.",
      },
      {
        type: "quiz",
        question: "🧠 Which of these best describes an XBRL Concept?",
        options: [
          "A unit of measure like USD or shares",
          "A time period used for reporting",
          "A label or identifier for a financial fact",
          "A data point's definition, such as 'Revenue'",
        ],
        correctIndex: 3,
        explanation:
          "A concept defines the nature of a fact—like whether it’s 'Revenue', 'Assets', or 'Net Income'.",
      },
      {
        type: "quiz",
        question: "📂 How does a Fact relate to a Concept in XBRL?",
        options: [
          "A fact is a type of taxonomy",
          "A fact is an actual reported value for a concept",
          "A fact defines the structure of a concept",
          "A fact lists all units available for a concept",
        ],
        correctIndex: 1,
        explanation:
          "A fact represents a value (like 1000000) associated with a concept (like Revenue).",
      },
      {
        type: "quiz",
        question:
          "Which best describes the relationship between a taxonomy and an instance document?",
        options: [
          "Taxonomy stores final numbers, instance defines tags",
          "Instance defines relationships, taxonomy stores data",
          "Taxonomy defines structure and rules; instance holds real facts",
          "Both store data in different formats",
        ],
        correctIndex: 2,
        explanation:
          "The taxonomy defines tags, relationships, and rules. The instance file uses those tags to report actual facts and values.",
      },
      {
        type: "knowledge",
        title: "🧾 Facts, Contexts & Units",
        text: `
Let’s understand how a company reports a **fact** (like revenue) in XBRL:

---

##### 📊 Example: Revenue Fact

\`\`\`xml
<us-gaap:Revenues contextRef="c1" unitRef="u1" decimals="0">
  1000000
</us-gaap:Revenues>
\`\`\`

✅ This means:  
**"Revenue is 1,000,000."**  
But what do **contextRef**, **unitRef**, and **decimals** mean❓

Let’s break it down 👇

---

##### 🏷️ What is a Context?

A **context** tells us:
- 🧑‍💼 **Who** reported the fact  
- 📅 **When** it applies  

It's like tagging a number with a **reporting entity and period**.

---

##### 🧾 Context Example: Who & When?

\`\`\`xml
<xbrli:context id="c1">
  <xbrli:entity>
    <xbrli:identifier scheme="http://example.com/irisbusiness">
      IrisBusiness
    </xbrli:identifier>
  </xbrli:entity>
  <xbrli:period>
    <xbrli:startDate>2024-01-01</xbrli:startDate>
    <xbrli:endDate>2024-12-31</xbrli:endDate>
  </xbrli:period>
</xbrli:context>

\`\`\`

🔹 **contextRef="c1"** → Links the fact to this context  
🔹 **Entity** → The company (IrisBusiness)  
🔹 **Identifier** → Unique company code or name  
🔹 **Scheme** → A URI that shows where the identifier comes from  
🔹 **Period** → Reporting duration (1 year)

---

##### 💰 What is a Unit?

A **unit** tells us:  
👉 What **measurement** the number is in — like currency, shares, or pure numbers.

\`\`\`xml
<xbrli:unit id="u1">
  <xbrli:measure>iso4217:USD</xbrli:measure>
</xbrli:unit>
\`\`\`

🔸 **unitRef="u1"** → Links the fact to this unit  
🔸 **Measure** → USD (US Dollars)

---

##### 🔢 What is Decimals?

The **decimals** attribute tells how precise the number is.  
- "0" → rounded to the nearest whole number  
- "2" → two decimal places  
- "-3" → rounded to the nearest thousand  
- "INF" → exact value (no rounding)

---

##### ✅ Final Meaning

**"IrisBusiness reported revenue of $1,000,000 in the year 2024, in US Dollars, rounded to the nearest dollar."**

That’s how **facts**, **contexts**, **units**, and **decimals** work together in XBRL!
`.trim(),
      },
      {
        type: "quiz",
        question:
          "What does the 'contextRef' attribute in an XBRL fact tag refer to?",
        options: [
          "The monetary unit used (e.g., USD)",
          "The XML schema file used",
          "The context block that defines the entity and time period",
          "The type of concept being reported",
        ],
        correctIndex: 2,
        explanation:
          "contextRef points to a <context> block that defines 'who' (entity) and 'when' (period) the fact applies to.",
      },
      {
        type: "quiz",
        question: "Which of these correctly defines a unit block in XBRL?",
        options: [
          "<xbrli:unit id='usd'><measure>USD</measure></xbrli:unit>",
          "<unit measure='USD'/>",
          "<xbrli:unit id='u1'><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>",
          "<unitRef='usd'><value>INR</value></unitRef>",
        ],
        correctIndex: 2,
        explanation:
          "XBRL unit blocks require correct namespacing and ISO codes — 'iso4217:USD' is the valid format within <xbrli:measure>.",
      },
      {
        type: "quiz",
        question:
          "What is the purpose of the <xbrli:identifier> element inside a <context>?",
        options: [
          "To specify the data source",
          "To link to the currency used",
          "To identify the reporting entity (e.g., company)",
          "To indicate if the value is audited",
        ],
        correctIndex: 2,
        explanation:
          "<xbrli:identifier> provides the unique identity of the entity reporting the data — like a company name or registration number.",
      },
      {
        type: "quiz",
        question: `How would you interpret this XBRL snippet?\n\n
    <ex:Profit contextRef=\"C1\" unitRef=\"u1\" decimals=\"-3\">120000</ex:Profit>`,
        options: [
          "Profit is exactly 120,000",
          "Profit is 120,000, rounded to the nearest thousand",
          "Profit is between 119,000 and 121,000",
          "Profit is negative due to -3 decimals",
        ],
        correctIndex: 1,
        explanation:
          "A 'decimals=\"-3\"' means the number is rounded to the nearest thousand. So 120,000 could represent anything from 119,500 to 120,499.",
      },
      {
        type: "knowledge",
        title: "🗓️ Instant vs Duration in XBRL Periods",
        text: `
In XBRL, every **fact** needs a **time context**. That’s what the **\`<xbrli:period>\`** tag does — it tells *when* the fact applies.

There are **three types** of periods you’ll see in XBRL:

---

##### ⚡ 1. Instant (A Single Date)

\`\`\`xml
<xbrli:period>
  <xbrli:instant>2024-12-31</xbrli:instant>
</xbrli:period>
\`\`\`

🕒 **Use this when** the fact is a *snapshot* on a specific day.  
📌 Example: Cash on December 31, 2024.

---

##### 📆 2. Duration (A Date Range)

\`\`\`xml
<xbrli:period>
  <xbrli:startDate>2024-01-01</xbrli:startDate>
  <xbrli:endDate>2024-12-31</xbrli:endDate>
</xbrli:period>
\`\`\`

🧮 **Use this when** the fact is measured *over time*.  
📌 Example: Total revenue **earned during** 2024.

---

##### ♾️ 3. Forever (Timeless Facts)

\`\`\`xml
<xbrli:period>
  <xbrli:forever/>
</xbrli:period>
\`\`\`

⏳ **Use this when** the fact has *no specific time*.  
📌 Example: Legal entity name, reporting currency, etc.
  `.trim(),
      },
      {
        type: "quiz",
        question: "Which of these would use an 'instant' period in XBRL?",
        options: [
          "Revenue earned during 2024",
          "Cash held as on 31-Dec-2024",
          "Name of legal entity",
          "Earnings per share across a quarter",
        ],
        correctIndex: 1,
        explanation:
          "Instant is for facts that apply at a single point in time, like balance sheet items — e.g., Cash on 31-Dec-2024.",
      },
      {
        type: "quiz",
        question: "Why would a company use a 'forever' period in XBRL?",
        options: [
          "To report high inflation items",
          "For facts that never change or have no timeframe (like entity name)",
          "To show forecasted values",
          "To define quarterly earnings",
        ],
        correctIndex: 1,
        explanation:
          "‘forever’ is used when a fact is timeless — e.g., reporting entity name or reporting currency, which aren’t time-bound.",
      },
      {
        type: "quiz",
        question: "Which of these correctly defines a unit block in XBRL?",
        options: [
          "<xbrli:unit id='usd'><measure>USD</measure></xbrli:unit>",
          "<unit measure='USD'/>",
          "<xbrli:unit id='u1'><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>",
          "<unitRef='usd'><value>INR</value></unitRef>",
        ],
        correctIndex: 2,
        explanation:
          "XBRL unit blocks require correct namespacing and ISO codes — 'iso4217:USD' is the valid format within <xbrli:measure>.",
      },
      {
        type: "quiz",
        question:
          "If a company reports 'Revenue' for Jan–Dec 2024, which element should it use?",
        options: [
          "<xbrli:instant>2024-12-31</xbrli:instant>",
          "<xbrli:forever/>",
          "<xbrli:startDate>2024-01-01</xbrli:startDate> + <xbrli:endDate>2024-12-31</xbrli:endDate>",
          "<period>2024</period>",
        ],
        correctIndex: 2,
        explanation:
          "For values that span time (like Revenue earned), you must use a <startDate> and <endDate> to show the full duration.",
      },
    ],
  },
  {
    id: 3,
    title: "Validating Instance Document",
    summary: "Dive into XBRL specification, XML schemas, and tagging rules.",
    image: xbrlImg,
    content: [
      {
        type: "knowledge",
        title: "📄 Sample XBRL Instance Document",
        image: instanceImg,
        imageSize: "special",
        text: '```xml\n<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance"\n            xmlns:iso4217="http://www.xbrl.org/2003/iso4217"\n            xmlns:ex="http://example.com/taxonomy">\n\n  <xbrli:context id="C1">\n    <xbrli:entity>\n      <xbrli:identifier scheme="http://example.com/irisbusiness">IrisBusiness</xbrli:identifier>\n    </xbrli:entity>\n    <xbrli:period>\n      <xbrli:startDate>2024-04-01</xbrli:startDate>\n      <xbrli:endDate>2025-03-31</xbrli:endDate>\n    </xbrli:period>\n  </xbrli:context>\n\n  <xbrli:unit id="U1">\n    <xbrli:measure>iso4217:INR</xbrli:measure>\n  </xbrli:unit>\n\n  <ex:Revenue contextRef="C1" unitRef="U1" decimals="0">10000000</ex:Revenue>\n</xbrli:xbrl>\n```',
      },
      {
        type: "knowledge",
        title: "🛡️ What is Bushchat? XBRL Validator Explained",
        text: `
After creating an XBRL Instance document, we need to **validate** it to ensure everything is correct and follows the taxonomy rules.

🎯 **Bushchat** is a smart **XBRL validator**. It checks whether your instance file is valid, accurate, and meaningful.

---

##### 🧪 What Bushchat Validates

✅ **Schema Validation**  
🔍 Checks if every concept (like *Revenue*) is defined correctly in the .xsd taxonomy.

---

🆔 **Context Validation**  
🔍 Makes sure \`contextRef="C1"\` exists and includes valid **entity** and **reporting period** information.

---

💰 **Unit Validation**  
🔍 Confirms that units like *INR* or *shares* are defined using the \`<unit>\` tag and are valid.

---

🔢 **Data Type Validation**  
🔍 Ensures values (like 123456.78) follow the correct **data format** (e.g., decimals, strings, dates).

---

➕ **Calculation Validation**  
🔍 If the taxonomy defines formulas (like *Assets = Liabilities + Equity*), it verifies that the math **adds up correctly**.

---

📊 **Dimensional Validation**  
🔍 Validates that any **axis-member combinations** used in facts (e.g., region = Asia) are correct and allowed.

---

🏷️ **Label & Presentation Check**  
🔍 Ensures each concept is **properly labeled** and appears in the correct section of the report.

---

📏 **Xule Rules (Business Logic)**  
🔍 Applies custom rules like:  
• Revenue > 0  
• Date must be in the current fiscal year  
• Total > Subparts

---

📂 Bushchat reads both:
- Your **XBRL Instance Document** (the data),
- And your **Taxonomy** (the rules).

🧠 Then it validates every part to give you clear ✅ passes or ❌ errors so you can fix issues before filing.`.trim(),
      },
      {
        type: "knowledge",
        title: "🕵️‍♂️ Think Like a Bushchat Validator!",
        text: `
You've learned the basics — now it's time to act like a **Bushchat Validator**!

🔍 Scan instance documents  
✅ Catch errors in context, units, and values  
🧠 Apply real rules like a pro

Ready to validate like never before?  
Let’s dive in! 🚀
`,
      },
      // 8. Code Activities
      {
        type: "code",
        title: "💱 Fix the Unit Reference",
        code: '<xbrli:unit id="u1">\n  <xbrli:measure>iso4217:USD</xbrli:measure>\n</xbrli:unit>\n\n<ex:Revenue contextRef="c1" unitRef="usd" decimals="0">100000</ex:Revenue>',
        question:
          "The `unitRef` must exactly match the defined unit's ID. Can you fix it?",
        validator: "validateUnitRefAnswer",
        explanation:
          "✅ Perfect! The unit reference now matches the defined unit.",
      },
      {
        type: "code",
        title: "🆔 Match the Context ID",
        code: '<xbrli:context id="C1">\n  <!-- ... -->\n</xbrli:context>\n\n<ex:Profit contextRef="c1" unitRef="u1" decimals="0">200000</ex:Profit>',
        question:
          "Context ID is case-sensitive. Match the `contextRef` exactly with the defined ID.",
        validator: "validateContextRefAnswer",
        explanation: "✅ Great job! The context ID matches perfectly now.",
      },
      {
        type: "code",
        title: "📅 Fix the Date Range",
        code: "<xbrli:period>\n  <xbrli:startDate>2025-04-01</xbrli:startDate>\n  <xbrli:endDate>2024-03-31</xbrli:endDate>\n</xbrli:period>",
        question:
          "Fix the date range so that the start date comes *before* the end date.",
        validator: "validateDateRangeAnswer",
        explanation: "✅ Nicely done! The date range is now valid.",
      },
      {
        type: "code",
        title: "💸 Fix the Currency Code",
        code: '<xbrli:unit id="U1">\n  <xbrli:measure>iso4217:XYZ</xbrli:measure>\n</xbrli:unit>',
        question:
          "Replace the invalid currency code with a real ISO 4217 code (like USD or INR).",
        validator: "validateCurrencyCodeAnswer",
        explanation: "✅ Excellent! That's a valid currency code.",
      },
      {
        type: "code",
        title: "📉 Revenue Can’t Be Negative",
        code: '<ex:Revenue contextRef="C1" unitRef="U1" decimals="0">-500000</ex:Revenue>',
        question:
          "Fix the fact value to follow business rules — revenue must be ≥ 0.",
        validator: "validateRevenueValueAnswer",
        explanation: "✅ You nailed it! The revenue is now valid.",
      },
      {
        type: "code",
        title: "🛠️ Challenge: Fix All 3 Errors",
        code: '<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance"\n            xmlns:iso4217="http://www.xbrl.org/2003/iso4217"\n            xmlns:ex="http://example.com/taxonomy">\n\n  <xbrli:context id="C1">\n    <xbrli:entity>\n      <xbrli:identifier scheme="http://example.com/entity">ABC_LTD</xbrli:identifier>\n    </xbrli:entity>\n    <xbrli:period>\n      <xbrli:startDate>2025-04-01</xbrli:startDate>\n      <xbrli:endDate>2024-03-31</xbrli:endDate>\n    </xbrli:period>\n  </xbrli:context>\n\n  <xbrli:unit id="U1">\n    <xbrli:measure>iso4217:XYZ</xbrli:measure>\n  </xbrli:unit>\n\n  <ex:Revenue contextRef="C1" unitRef="U1" decimals="0">-500000</ex:Revenue>\n</xbrli:xbrl>',
        question:
          "Fix all 3 validation issues: date range, invalid currency, and negative revenue.",
        validator: "validateAllFixesAnswer",
        explanation: "✅ Amazing! You fixed all the validation errors.",
      },
      {
        type: "code",
        title: "🪛 Fix the Broken XBRL Snippet",
        code: '<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance"\n            xmlns:iso4217="http://www.xbrl.org/2003/iso4217"\n            xmlns:ex="http://example.com/taxonomy">\n\n  <xbrli:context id="C1">\n    <xbrli:entity>\n      <xbrli:identifier scheme="http://example.com/entity">XYZ_CORP</xbrli:identifier>\n    </xbrli:entity>\n    <xbrli:period>\n      <xbrli:instant>2024-13-01</xbrli:instant>\n    </xbrli:period>\n  </xbrli:context>\n\n  <xbrli:unit id="U1">\n    <xbrli:measure>iso4217:usd</xbrli:measure>\n  </xbrli:unit>\n\n  <ex:Assets contextRef="C1" unitRef="U1" decimals="INF">1000000.50</ex:Assets>\n\n  <ex:Liabilities contextRef="C2" unitRef="U1" decimals="0">400000</ex:Liabilities>\n</xbrli:xbrl>',
        question: `
.🔎Review the XBRL snippet carefully and correct all errors related to date validity, currency code casing, decimals precision, and context reference integrity. Edit the XML so that:

- 🗓️ The &lt;xbrli:instant&gt; contains a valid date (month 01–12, valid day).
- 💱 The currency code in &lt;xbrli:measure&gt; is uppercase and a valid ISO 4217 code (e.g., USD).
- 🔢 The decimals attribute matches the precision of the number (e.g., decimals="2" for 1000000.50).
- 📌 All contextRef attributes reference existing &lt;xbrli:context&gt; IDs.

`,
        validator: "validateBushchatHandsOnSnippet",
        explanation:
          "🎉 Excellent work! Your corrected snippet should:\n\n- ✔️ Use valid calendar dates (no invalid months or days).\n- ✔️ Include ISO 4217 currency codes in uppercase (e.g., USD, EUR).\n- ✔️ Set the decimals attribute to accurately reflect the decimal places of the amount.\n- ✔️ Reference only defined <xbrli:context> IDs for all contextRef attributes — this ensures all facts are properly associated with their context, such as reporting periods and entities.\n\nBy ensuring these aspects, you're practicing essential real-world XBRL validation steps required for high-quality, compliant financial reporting. Keep refining your skills! 🚀",
      }
    ],
  },
  {
    id: 4,
    title: "Dimensions In Taxonomy",
    summary: "How to read, create, and customize taxonomies.",
    image: xbrlImg,
    content: [
  {
    "type": "knowledge",
    "title": "🧭 What are XBRL Dimensions?",
    "text": "Imagine you have a number, like a **Sales Amount of $50,000** 💸.\n\n" +
            "In XBRL, this is called a **Fact**. But just knowing the sales amount isn't enough; you need more details! 🤔\n\n" +
            "**Dimensions** give **extra meaning or detail** to a fact. They help you categorize your data. 🏷️\n\n" +
            "Think of them as **tags** that add specific characteristics to your data. 📌\n\n" +
            "--- \n\n" +
            "**Simple Example:**\n\n" +
            "If your fact is `Sales = $50,000`,\n\n" +
            "A **dimension** could tell you:\n" +
            "- **Which Product?** (e.g., Mobile Phones 📱)\n" +
            "- **Which Region?** (e.g., Asia 🌏)\n" +
            "- **What Age Group of Customer?** (e.g., 25 years old 🧑)\n\n" +
            "So, `Product`, `Region`, and `Customer Age` are all **dimensions** that make your Sales fact much more specific and useful! ✨"
  },
  {
    "type": "knowledge",
    "title": "🏷️ Explicit vs. Typed Dimensions",
    "text": "XBRL uses two main types of dimensions, depending on how you want to categorize your data:\n\n" +
            "--- \n\n" +
            "#### 1. 🔖 Explicit Dimensions\n\n" +
            "**When to use:** When your categories are from a **fixed, pre-defined list** of choices. ✅\n\n" +
            "**Think of it like:** A dropdown menu 🔽 or multiple-choice options. You **must choose** one of the options already provided in the XBRL dictionary (taxonomy).\n\n" +
            "**Example:**\n" +
            "- **Dimension Axis:** `ProductCategory`\n" +
            "- **Allowed Choices (Members):** `MobilePhones`, `Laptops`, `TVs`\n" +
            "  *You can only pick 'MobilePhones', 'Laptops', or 'TVs'. You can't make up 'Headphones' if it's not on the list!* 🚫\n\n" +
            "--- \n\n" +
            "#### 2. 🧾 Typed Dimensions\n\n" +
            "**When to use:** When your categories can be **any custom value** of a certain type. ✍️\n\n" +
            "**Think of it like:** A text box ⌨️ or number input field. You provide the value yourself, as long as it fits the expected format (e.g., a number, a date, an address).\n\n" +
            "**Example:**\n" +
            "- **Dimension Axis:** `CustomerAge`\n" +
            "- **Allowed Values:** Any whole number (integer) 🔢\n" +
            "  *You can enter '25', '30', '42', etc. Any valid number is fine!* 👍\n\n" +
            "--- \n\n" +
            "**In Short:**\n" +
            "- **Explicit:** Pick from a list (e.g., 'Asia', 'Europe', 'North America'). 🌍\n" +
            "- **Typed:** Write your own value (e.g., '123 Main St.', 'Invoice_9876'). 🏠"
  },
  {
    "type": "knowledge",
    "title": "📚 Taxonomy: Defining a Dimension Axis 🎯",
    "text": "Before you can use a dimension, you must **define its axis** in the XBRL Taxonomy (the XSD file). Think of an axis as the *category* itself, like 'Region' or 'Product Category'. 📁\n\n" +
            "Here's how you define a `RegionAxis` (an **Explicit** Dimension Axis) in the taxonomy:\n\n" +
            "```xml\n" +
            "<xs:schema \n" +
            "  xmlns:xs=\"[http://www.w3.org/2001/XMLSchema](http://www.w3.org/2001/XMLSchema)\"\n" +
            "  xmlns:xbrldi=\"[http://xbrl.org/2006/xbrldi](http://xbrl.org/2006/xbrldi)\"\n" +
            "  xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n" +
            "  targetNamespace=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n" +
            "  elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n" +
            "  \n" +
            "  <xs:element name=\"RegionAxis\" type=\"xbrldi:explicitDimensionItemType\"\n" +
            "              substitutionGroup=\"xbrldi:dimension\" />\n\n" +
            "</xs:schema>\n" +
            "```\n\n" +
            "**Key Points:**\n" +
            "- `<xs:element name=\"RegionAxis\">`: This gives your dimension axis a **unique name**. 🏷️\n" +
            "- `type=\"xbrldi:explicitDimensionItemType\"`: This tells XBRL it's an **explicit** dimension, meaning it will use a fixed list of members. 📝\n" +
            "- `substitutionGroup=\"xbrldi:dimension\"`: This is a very important part! It tells the XBRL system: \n" +
            "  * \"My custom element, `RegionAxis`, should be **treated as a dimension**.\" \n" +
            "  * \"It 'inherits' all the rules and behaviors that come with being a dimension in XBRL.\" \n" +
            "  Think of it as classifying `RegionAxis` so XBRL knows its special role. 🔗"
  },
  {
    "type": "knowledge",
    "title": "📚 Taxonomy: Defining Explicit Members 📝",
    "text": "After defining an **Explicit Dimension Axis** (like `RegionAxis`), you need to define its **members**. These are the specific choices or values that can be used for that dimension, like 'Asia' or 'Europe'. ✅\n\n" +
            "Here's how you define `AsiaMember` and `EuropeMember` for `RegionAxis` in the taxonomy:\n\n" +
            "```xml\n" +
            "<xs:schema \n" +
            "  xmlns:xs=\"[http://www.w3.org/2001/XMLSchema](http://www.w3.org/2001/XMLSchema)\"\n" +
            "  xmlns:xbrldi=\"[http://xbrl.org/2006/xbrldi](http://xbrl.org/2006/xbrldi)\"\n" +
            "  xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n" +
            "  targetNamespace=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n" +
            "  elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n" +
            "  \n\n" +
            "  \n" +
            "  <xs:element name=\"AsiaMember\" substitutionGroup=\"xbrli:item\" />\n" +
            "  <xs:element name=\"EuropeMember\" substitutionGroup=\"xbrli:item\" />\n\n" +
            "</xs:schema>\n" +
            "```\n\n" +
            "**Key Points:**\n" +
            "- `<xs:element name=\"AsiaMember\">`: This gives your dimension member a **unique name**. 🏷️\n" +
            "- `substitutionGroup=\"xbrli:item\"`: This is also important! It tells the XBRL system:\n" +
            "  * \"My custom element, `AsiaMember` (or `EuropeMember`), is a **type of XBRL 'item'**.\" \n" +
            "  * In XBRL, 'items' are the fundamental building blocks for reporting facts, like 'Cash', 'Revenue', or in this case, a specific dimension member. It means this element can be used as a valid value or concept in an XBRL report. 📊"
  },
   {
    "type": "knowledge",
    "title": "📄 Instance: Explicit Dimensions in Context ✅",
    "text": "Once you have defined your Explicit Dimension Axis and its Members in the Taxonomy, you can use them in your XBRL instance document within a `context`.\n\n" +
            "You use the `<xbrldi:explicitMember>` tag to pick a specific member from your predefined list. 🔖\n\n" +
            "```xml\n" +
            "<xbrli:context id=\"C1\">\n" +
            "  \n" +
            "  \n" +
            "  \n" +
            "  <xbrli:entity>\n" +
            "    <xbrli:identifier scheme=\"[http://example.com/entity](http://example.com/entity)\">XYZ_CORP</xbrli:identifier>\n" +
            "    <xbrli:segment>\n" +
            "      \n" +
            "      <xbrldi:explicitMember dimension=\"ex:RegionAxis\">ex:AsiaMember</xbrldi:explicitMember>\n" +
            "    </xbrli:segment>\n" +
            "  </xbrli:entity>\n" +
            "  <xbrli:period>\n" +
            "    <xbrli:instant>2025-06-30</xbrli:instant>\n" +
            "  </xbrli:period>\n" +
            "  \n" +
            "</xbrli:context>\n" +
            "```\n\n" +
            "**Key Points:**\n" +
            "- `dimension=\"ex:RegionAxis\"`: This attribute points to the **dimension axis** you defined in the taxonomy. 🎯\n" +
            "- `ex:AsiaMember`: This is the **specific member** (choice) you are applying, which must be one of the members defined for `ex:RegionAxis` in your taxonomy. ✅\n" +
            "- **Location:** Explicit dimensions can appear inside either `xbrli:segment` (which provides details about the *entity* 🏢) or `xbrli:scenario` (which describes specific *conditions* for the fact). 📊"
  },
  {
    "type": "knowledge",
    "title": "📚 Taxonomy: Defining a Typed Dimension and its Value ⚙️",
    "text": "For a **Typed Dimension** (like `CustomerAge`), you also define its axis, but instead of a fixed list of members, you define the *type* of data it can hold (e.g., an integer 🔢, a string 🔡, a date 📅).\n\n" +
            "You typically define two things in the taxonomy:\n" +
            "1.  The **Typed Dimension Axis** itself. 🎯\n" +
            "2.  The **element** that will actually hold the custom value (e.g., `<ex:CustomerAge>`). ✍️\n\n" +
            "```xml\n" +
            "<xs:schema \n" +
            "  xmlns:xs=\"[http://www.w3.org/2001/XMLSchema](http://www.w3.org/2001/XMLSchema)\"\n" +
            "  xmlns:xbrldi=\"[http://xbrl.org/2006/xbrldi](http://xbrl.org/2006/xbrldi)\"\n" +
            "  xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n" +
            "  targetNamespace=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n" +
            "  elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n" +
            "  \n" +
            "  <xs:element name=\"CustomerAgeAxis\" type=\"xbrldi:typedDimensionItemType\"\n" +
            "              substitutionGroup=\"xbrldi:dimension\" />\n\n" +
            "  \n" +
            "  <xs:element name=\"CustomerAge\" type=\"xs:integer\" />\n\n" +
            "</xs:schema>\n" +
            "```\n\n" +
            "**Key Points:**\n" +
            "- `type=\"xbrldi:typedDimensionItemType\"`: This tells XBRL it's a **typed** dimension, allowing custom values. 💡\n" +
            "- `substitutionGroup=\"xbrldi:dimension\"` (for `CustomerAgeAxis`): Just like with explicit dimensions, this line tells XBRL that `CustomerAgeAxis` is indeed a dimension and should be treated as such. 🔗\n" +
            "- `<xs:element name=\"CustomerAge\" type=\"xs:integer\"/>`: This defines the actual XML element that will be used inside the typed dimension and specifies that its content must be an integer (a whole number). This `CustomerAge` element itself is not directly a `substitutionGroup` of `xbrli:item` in the same way the explicit members are; its role is defined by its type and its intended use within the typed dimension. 🔢"
  },
  {
    "type": "knowledge",
    "title": "📄 Instance: Typed Dimensions in Context 🖋️",
    "text": "For Typed Dimensions, where you provide a custom value instead of picking from a list, you use the `<xbrldi:typedMember>` tag. ✍️\n\n" +
            "The value you provide inside this tag must match the type defined in your taxonomy for that dimension (e.g., an integer 🔢, a string 🔡, etc.).\n\n" +
            "```xml\n" +
            "<xbrli:context id=\"C1\">\n" +
            "  \n" +
            "\n" +
            "  \n" +
            "  <xbrli:entity>\n" +
            "    <xbrli:identifier scheme=\"[http://example.com/entity](http://example.com/entity)\">XYZ_CORP</xbrli:identifier>\n" +
            "  </xbrli:entity>\n" +
            "  <xbrli:period>\n" +
            "    <xbrli:instant>2025-06-30</xbrli:instant>\n" +
            "  </xbrli:period>\n" +
            "  <xbrli:scenario>\n" +
            "    \n" +
            "    <xbrldi:typedMember dimension=\"ex:CustomerAgeAxis\">\n" +
            "      <ex:CustomerAge>25</ex:CustomerAge>\n" +
            "    </xbrldi:typedMember>\n" +
            "  </xbrli:scenario>\n" +
            "</xbrli:context>\n" +
            "```\n\n" +
            "**Key Points:**\n" +
            "- `dimension=\"ex:CustomerAgeAxis\"`: This attribute points to the **typed dimension axis** defined in your taxonomy. 🎯\n" +
            "- `<ex:CustomerAge>25</ex:CustomerAge>`: This is the **actual custom value**. `ex:CustomerAge` is the element defined in the taxonomy to hold this value, and `25` is the value itself. This value must match the `type` (e.g., `xs:integer`) specified in the taxonomy. 🔢\n" +
            "- **Location:** Typed dimensions can also appear inside either `xbrli:segment` or `xbrli:scenario`. 📍"
  },
   {
    "type": "code",
    "title": "🎯 Activity 1: Identify and Use Correct Dimensions",
    "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n  <xs:element name=\"ProductAxis\" type=\"xbrldi:explicitDimensionItemType\" substitutionGroup=\"xbrldi:dimension\" />\n  <xs:element name=\"CarsMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n  <xs:element name=\"BikesMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n\n</xs:schema>",
    "code": "<xbrli:context xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n               xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\"\n               xmlns:ex=\"http://example.com/taxonomy\"\n               id=\"Context_A\">\n  <xbrli:entity>\n    <xbrli:identifier scheme=\"http://example.com/entity\">ABC_Co</xbrli:identifier>\n    <xbrli:segment>\n      \n    </xbrli:segment>\n  </xbrli:entity>\n  <xbrli:period>\n    <xbrli:instant>2025-03-31</xbrli:instant>\n  </xbrli:period>\n</xbrli:context>",
    "question": "📝 **Your Task:** Look at the `ProductAxis` and its members defined in the Taxonomy XML.\n\nEdit the `instanceCode` below by adding an `<xbrldi:explicitMember>` element inside `<xbrli:segment>`.\n\n- Use `dimension=\"ex:ProductAxis\"`.\n- Choose either `ex:CarsMember` or `ex:BikesMember` as the member.",
    "hint": "Remember the structure of an explicit member: `<xbrldi:explicitMember dimension=\"[AXIS_NAME]\">[MEMBER_NAME]</xbrldi:explicitMember>`. Make sure to use the full qualified names (e.g., `ex:ProductAxis`).",
    "validator": "validateBeginner1",
    "explanation": "✅ The taxonomy defines `ProductAxis` with `CarsMember` and `BikesMember` as valid members.\n\nYour corrected instance should look like this (choosing one member):\n\n```xml\n<xbrli:context ...>\n  <xbrli:entity>\n    ...\n    <xbrli:segment>\n      <xbrldi:explicitMember dimension=\"ex:ProductAxis\">ex:CarsMember</xbrldi:explicitMember>\n    </xbrli:segment>\n  </xbrli:entity>\n  ...\n</xbrli:context>\n```"
  },
  {
    "type": "code",
    "title": "📝 Activity 2: Fix a Misspelled Dimension",
    "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n  <xs:element name=\"LocationAxis\" type=\"xbrldi:explicitDimensionItemType\" substitutionGroup=\"xbrldi:dimension\" />\n  <xs:element name=\"NorthMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n  <xs:element name=\"SouthMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n\n</xs:schema>",
    "code": "<xbrli:context xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n               xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\"\n               xmlns:ex=\"http://example.com/taxonomy\"\n               id=\"Context_B\">\n  <xbrli:entity>\n    <xbrli:identifier scheme=\"http://example.com/entity\">DEF_Ltd</xbrli:identifier>\n    <xbrli:segment>\n      <xbrldi:explicitMember dimension=\"ex:LocatoinAxis\">ex:NortMember</xbrldi:explicitMember> \n    </xbrli:segment>\n  </xbrli:entity>\n  <xbrli:period>\n    <xbrli:instant>2025-06-30</xbrli:instant>\n  </xbrli:period>\n</xbrli:context>",
    "question": "📝 **Your Task:** The instance XML contains a dimension with a misspelling.\n\n- Compare the `dimension` attribute and the member text in `<xbrldi:explicitMember>` with the taxonomy definitions.\n- Correct `dimension=\"ex:LocatoinAxis\"` to the proper dimension axis.\n- Correct `ex:NortMember` to a valid member from the taxonomy (e.g., `ex:NorthMember`).",
    "hint": "Pay very close attention to the spelling in the `dimension` attribute and the member's text content. Every character matters!",
    "validator": "validateBeginner2",
    "explanation": "✅ Dimensions and members must precisely match their definitions in the taxonomy.\n\n- `ex:LocatoinAxis` should be `ex:LocationAxis`.\n- `ex:NortMember` should be `ex:NorthMember` (or `ex:SouthMember`).\n\nCorrecting these ensures the instance data refers to the correct elements in the taxonomy."
  },
   {
    "type": "code",
    "title": "🔄 Activity 3: Replace Incorrect Dimensions Using the Taxonomy",
    "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n  <xs:element name=\"RegionAxis\" type=\"xbrldi:explicitDimensionItemType\" substitutionGroup=\"xbrldi:dimension\" />\n  <xs:element name=\"AsiaMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n  <xs:element name=\"EuropeMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n\n</xs:schema>",
    "code": "<xbrli:context xmlns:xbrli=\"http://www.xbrl.org/2003/instance\" \n               xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\" \n               xmlns:ex=\"http://example.com/taxonomy\" \n               id=\"C1\">\n  <xbrli:entity>\n    <xbrli:identifier scheme=\"http://example.com/entity\">XYZ_CORP</xbrli:identifier>\n    <xbrli:segment>\n      <xbrldi:explicitMember dimension=\"ex:WrongRegionAxis\">ex:AsaMember</xbrldi:explicitMember> \n    </xbrli:segment>\n  </xbrli:entity>\n  <xbrli:period>\n    <xbrli:instant>2025-06-30</xbrli:instant>\n  </xbrli:period>\n</xbrli:context>",
    "question": "📝 **Your Task:** Cross-check the taxonomy above with the instance below.\n\n- Identify the incorrect `dimension` attribute (`ex:WrongRegionAxis`) and the incorrect member (`ex:AsaMember`) used in the instance's `<xbrldi:explicitMember>`.\n- **Replace** `dimension=\"ex:WrongRegionAxis\"` with the correct dimension axis from the taxonomy.\n- **Replace** the member `ex:AsaMember` with a valid member from the taxonomy (`ex:AsiaMember` or `ex:EuropeMember`).\n\n✏️ Edit the instance XML snippet and submit your corrected version.",
    "hint": "Both the dimension axis and the dimension member in the instance's explicit member are wrong. Look for the correct names in the `<xs:element>` definitions in the Taxonomy XML.",
    "validator": "validateIntermediate1",
    "explanation": "✅ Dimensions must use exact axis names and member names defined in the taxonomy.\n\n- Only `RegionAxis` is a valid dimension axis here.\n- Valid members are `AsiaMember` and `EuropeMember`.\n\nCorrecting these incorrect names ensures your facts are correctly contextualized."
  },
  {
  "type": "code",
  "title": "🧹 Activity 4: Remove Dimensions Not Present in Taxonomy",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n  <xs:element name=\"RegionAxis\" type=\"xbrldi:explicitDimensionItemType\" substitutionGroup=\"xbrldi:dimension\" />\n  <xs:element name=\"AsiaMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n\n</xs:schema>",
  "code": "<xbrli:context xmlns:xbrli=\"http://www.xbrl.org/2003/instance\" \n               xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\" \n               xmlns:ex=\"http://example.com/taxonomy\" \n               id=\"C2\">\n  <xbrli:entity>\n    <xbrli:identifier scheme=\"http://example.com/entity\">XYZ_CORP</xbrli:identifier>\n    <xbrli:segment>\n      <xbrldi:explicitMember dimension=\"ex:RegionAxis\">ex:AsiaMember</xbrldi:explicitMember> \n      <xbrldi:explicitMember dimension=\"ex:DepartmentAxis\">ex:SalesDepartmentMember</xbrldi:explicitMember> \n    </xbrli:segment>\n  </xbrli:entity>\n  <xbrli:period>\n    <xbrli:instant>2025-06-30</xbrli:instant>\n  </xbrli:period>\n</xbrli:context>",
  "question": "🧹 **Your Task:** Review the taxonomy and instance carefully.\n\n- The instance has two explicit members: one valid (`ex:RegionAxis` / `ex:AsiaMember`), and one that references a dimension axis or member **not** present in the taxonomy (`ex:DepartmentAxis` / `ex:SalesDepartmentMember`).\n- Identify the `<xbrldi:explicitMember>` element that does not match any definition in the Taxonomy XML.\n- **Remove** this invalid explicit member entirely, so that only valid dimensions remain.",
  "hint": "Only the dimension axis and member explicitly declared in the taxonomy can exist in the instance. Any explicit members in the instance that do not have an exact match in the taxonomy must be deleted.",
  "validator": "validateIntermediate2",
  "explanation": "✅ Keeping only valid dimensions in your instance XML is crucial for correct XBRL reporting.\n\n- The taxonomy defines only `RegionAxis` and `AsiaMember`.\n- The explicit member referencing `ex:DepartmentAxis` and `ex:SalesDepartmentMember` is not defined in this specific taxonomy and must be removed.\n- This step cleans up the context and prevents validation errors."
},
  {
  "type": "code",
  "title": "💡 Activity 5: Challenge - Validate & Correct Dimension Placement",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n  <xs:element name=\"ProductAxis\" type=\"xbrldi:explicitDimensionItemType\" substitutionGroup=\"xbrldi:dimension\" />\n  <xs:element name=\"ElectronicsMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n  <xs:element name=\"FurnitureMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n\n  <xs:element name=\"RegionAxis\" type=\"xbrldi:explicitDimensionItemType\" substitutionGroup=\"xbrldi:dimension\" />\n  <xs:element name=\"AsiaMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n  <xs:element name=\"EuropeMember\" type=\"xs:string\" substitutionGroup=\"xbrli:item\" />\n\n</xs:schema>",
  "code": "<xbrli:context xmlns:xbrli=\"http://www.xbrl.org/2003/instance\" \n               xmlns:xbrldi=\"http://xbrl.org/2006/xbrldi\" \n               xmlns:ex=\"http://example.com/taxonomy\" \n               id=\"C3\">\n  <xbrli:entity>\n    <xbrli:identifier scheme=\"http://example.com/entity\">XYZ_CORP</xbrli:identifier>\n    <xbrli:segment>\n      <xbrldi:explicitMember dimension=\"ex:RegionAxis\">ex:AsiaMember</xbrldi:explicitMember>\n      <xbrldi:explicitMember dimension=\"ex:ProductAxis\">ex:ElectronicsMember</xbrldi:explicitMember> \n    </xbrli:segment>\n    <xbrli:scenario>\n      <xbrldi:explicitMember dimension=\"ex:RegionAxis\">ex:EuropeMember</xbrldi:explicitMember> \n    </xbrli:scenario>\n  </xbrli:entity>\n  <xbrli:period>\n    <xbrli:instant>2025-06-30</xbrli:instant>\n  </xbrli:period>\n</xbrli:context>",
  "question": "💡 **Your Task:** Perform a detailed review of dimensions and their locations.\n\n- **Rule: A specific dimension axis (like `RegionAxis`) can only appear ONCE in an XBRL context.** If it appears more than once, even in different parts like `segment` and `scenario`, it's an error. Also, ensure all dimensions use valid axes and members from the taxonomy.\n- **Correct** the explicit member for `RegionAxis` inside `<xbrli:scenario>`. Since `RegionAxis` is already correctly defined in `<xbrli:segment>` as `ex:AsiaMember`, the one in `scenario` is redundant and problematic. **You must remove it.**\n- **Move** the `ProductAxis` dimension (`ex:ProductAxis` with `ex:ElectronicsMember`) from `<xbrli:segment>` to `<xbrli:scenario>`, as `ProductAxis` is typically used to describe the 'scenario' or specific conditions of a fact.\n\n✏️ Make the necessary corrections and submit your fixed instance XML.",
  "hint": "Remember the fundamental XBRL rule: each dimension axis must be unique within a single context. This means if `RegionAxis` defines the entity's region in the `segment`, you cannot define it again in the `scenario`. Consider `segment` for 'who/where' and `scenario` for 'what kind'.",
  "validator": "validateAdvanced1",
  "explanation": "✅ Good dimension validation includes:\n\n- **Ensuring Dimension Uniqueness:** Each dimension axis (e.g., `RegionAxis`) can appear only once within an XBRL context. Duplicate dimensions lead to ambiguity and validation errors. The `RegionAxis` in `scenario` was a duplicate of the one in `segment`.\n- **Correct Placement:** `RegionAxis` is typically an entity-related dimension, belonging in `<xbrli:segment>`. `ProductAxis` (Electronics/Furniture) is generally a scenario-related dimension, belonging in `<xbrli:scenario>`.\n- **Valid Members:** Using only dimension members defined in the taxonomy is crucial. The original `ex:EuropeMember` within the scenario's `RegionAxis` was problematic because of the duplicate axis, not necessarily an invalid member itself, but its presence there violated the uniqueness rule.\n\nProper dimension location, valid member usage, and unique axis definitions improve report clarity and compliance."
}
    ],
  },
  {
    id: 5,
    title: "XBRL Taxonomies",
    summary: "Prepare filings and validate reports effectively.",
    image: xbrlImg,
    content: [
  {
    "type": "knowledge",
    "title": "📄 What is XBRL Schema (XSD)?",
    "text": "The **XBRL Schema** (often called an **XSD file**) is like the **main blueprint** 🗺️ for an XBRL taxonomy.\n\n" +
            "It's the core file that **defines all the basic building blocks** you'll use in your financial reports.\n\n" +
            "🤔 **Think of it like:** The architectural plans for a building. It tells you:\n" +
            "- What each 'room' (concept) is. 🏠\n" +
            "- What kind of content each 'room' can hold (e.g., numbers, text). 🔢\n" +
            "- How different parts of the building are generally laid out. 🏗️\n\n" +
            "It's where you define new concepts and their fundamental properties."
  },
  {
    "type": "knowledge",
    "title": "📦 Namespaces in Schema (targetNamespace)",
    "text": "Every XBRL Schema has a **Namespace**, which is a unique internet address (URI) that identifies all the concepts defined within that specific schema. 🌐\n\n" +
            "**Why is it needed?** Imagine two companies both define an element called 'Sales'. How does XBRL know which 'Sales' you mean?\n\n" +
            "Namespaces solve this by making sure every concept has a **globally unique identity**. ✨\n\n" +
            "The `targetNamespace` attribute in the `<xs:schema>` tag declares this unique identity:\n" +
            "```xml\n" +
            "<xs:schema targetNamespace=\"[http://example.com/taxonomy](http://example.com/taxonomy)\" \n" +
            "           xmlns:xs=\"[http://www.w3.org/2001/XMLSchema](http://www.w3.org/2001/XMLSchema)\"\n" +
            "           ... >\n" +
            "```\n\n" +
            "**Key Points:**\n" +
            "- `targetNamespace`: This URI is the **unique address** for all elements you define in *this specific schema file*. 🆔\n" +
            "- It prevents name clashes when combining concepts from different taxonomies. 🤝"
  },
  {
    "type": "knowledge",
    "title": "🔗 Schema's Link to Linkbases",
    "text": "The XBRL Schema (XSD file) also acts as the central hub by **linking to other important files called Linkbases**. 🔗\n\n" +
            "Think of it like the master index in a book that tells you where to find specific chapters (linkbases) that add more details and relationships to your concepts. 📚\n\n" +
            "This is done using the `<linkbaseRef>` tag, usually at the top of the schema file:\n\n" +
            "```xml\n" +
            "<linkbaseRef xlink:href=\"label.xml\" \n" +
            "             xlink:type=\"simple\" \n" +
            "             xlink:role=\"[http://www.xbrl.org/2003/role/labelLinkbaseRef](http://www.xbrl.org/2003/role/labelLinkbaseRef)\"/>\n" +
            "```\n\n" +
            "**Key Points:**\n" +
            "- `xlink:href=\"label.xml\"`: This specifies the **file name** of the linkbase being linked (e.g., `label.xml` for the Label Linkbase). 📁\n" +
            "- `xlink:role`: This tells XBRL **what type of linkbase** it is (e.g., a label linkbase, a presentation linkbase, etc.). It helps the software understand the purpose of the linked file. 🎯\n" +
            "\n" +
            "This connection is vital because, without linkbases, the concepts defined in the schema would be isolated and lack meaning for human readers or financial analysis tools. 🧩"
  },
  {
    "type": "knowledge",
    "title": "🧩 What are XBRL Linkbases?",
    "image":taxonomyImg,
    "imageSize":"large",
    "text": "While the XBRL Schema (XSD) defines the basic concepts, **Linkbases** are separate XML files that **add meaning and define relationships** between these concepts. 🔗\n\n" +
            "Imagine schema elements as **puzzle pieces** 🧩. On their own, they are just shapes. Linkbases are the **picture on the box** 🖼️ that shows how all the pieces fit together to form a complete and understandable report.\n\n" +
            "They tell you:\n" +
            "- What a concept is *called* in plain language. 🗣️\n" +
            "- How concepts are *organized* visually. 📋\n" +
            "- How concepts *relate mathematically*. ➕➖\n" +
            "- How concepts define *complex structures* (like dimensions). 🧭\n" +
            "- Where concepts get their *official definitions*. 📚\n\n" +
            "There are 5 common types of linkbases, each serving a specific purpose."
  },
  {
    "type": "knowledge",
    "title": "🤝 What are Arcroles? (Relationship Types)",
    "text": "In XBRL, concepts aren't isolated; they are **connected** in meaningful ways. **Arcroles** (Arc Roles) are the key to understanding these connections! 🔗\n\n" +
            "Arcroles define the **specific type of relationship** between two concepts (or resources) in a linkbase. They tell you *how* concepts are related and give meaning to the 'arcs' (the connections).\n\n" +
            "Think of them as the **labels on arrows** connecting boxes in a flowchart. ➡️\n\n" +
            "- An arrow from 'Assets' to 'Cash' could be labeled 'has-component' (Parent-Child).\n" +
            "- An arrow from 'Total Revenue' to 'Online Revenue' could be labeled 'sums-up' (Summation-Item).\n\n" +
            "Arcroles ensure that XBRL software correctly interprets the logical and mathematical connections between your financial concepts. ✅"
  },
  {
    "type": "knowledge",
    "title": "🖋️ Common Arcroles in Detail",
    "text": "Here are some of the most common and important **Arcroles** used in XBRL linkbases:\n\n" +
            "1.  **`parent-child`** 🌳\n" +
            "    - **Purpose:** Shows **hierarchy** or breakdown relationships. Used mainly in the **Presentation Linkbase**. 📋\n" +
            "    - **Example:** `elec:TotalAssets` is the parent of `elec:FixedAssets` (meaning Fixed Assets are part of Total Assets).\n\n" +
            "2.  **`summation-item`** ➕➖\n" +
            "    - **Purpose:** Defines **calculation relationships** where one item is the sum or a component of another. Used in the **Calculation Linkbase**. 🧮\n" +
            "    - **Example:** `elec:TotalRevenue` is the sum of `elec:OnlineRevenue` and `elec:RetailRevenue`.\n\n" +
            "3.  **`domain-member`** 🌐\n" +
            "    - **Purpose:** Connects a **dimension axis** to its allowed **members**. Used primarily in the **Definition Linkbase**. 🧭\n" +
            "    - **Example:** The dimension axis `elec:RegionAxis` has `elec:AsiaMember` and `elec:EuropeMember` as its allowed members.\n\n" +
            "Understanding these arcroles helps you interpret the structure and logic of an XBRL taxonomy."
  },
  {
    "type": "knowledge",
    "title": "⚙️ How Arcroles are Written in XBRL",
    "text": "Arcroles are specified within special 'arc' elements in XBRL linkbases. These arcs create the connections between concepts.\n\n" +
            "Here's an example of how an arcrole might appear in XML (e.g., in a Presentation Linkbase):\n\n" +
            "```xml\n" +
            "<presentationArc\n" +
            "  xlink:type=\"arc\"\n" +
            "  xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/parent-child](http://www.xbrl.org/2003/arcrole/parent-child)\"\n" +
            "  xlink:from=\"elec:TotalAssets\"\n" +
            "  xlink:to=\"elec:FixedAssets\"\n" +
            "  order=\"1\"\n" +
            "  use=\"optional\" />\n" +
            "```\n\n" +
            "**Key Attributes in an Arc Element:**\n" +
            "- `xlink:type=\"arc\"`: This always indicates that the element is a relationship 'arc'. 🏹\n" +
            "- `xlink:arcrole`: This is where the **specific type of relationship** (the arcrole) is defined, using a unique URI (e.g., `parent-child`). 🔗\n" +
            "- `xlink:from`: Specifies the **starting concept** of the relationship. ➡️ (The 'parent' in parent-child)\n" +
            "- `xlink:to`: Specifies the **ending concept** of the relationship. ⬅️ (The 'child' in parent-child)\n" +
            "- `order`, `weight`, `use`: These provide **additional metadata** specific to the relationship type (e.g., `order` for display, `weight` for calculations). ⚙️\n\n" +
            "This structure ensures precise and machine-readable semantics for all relationships in XBRL taxonomies. ✅"
  },
    {
    "type": "knowledge",
    "title": "🏷️ Label Linkbase: Naming Your Concepts",
    "text": "The **Label Linkbase** 🏷️ is all about making XBRL reports **human-friendly**. It connects the technical concept names (like `NetIncomeLoss`) to labels that people can easily understand (like \"Net Income\").\n\n" +
            "Concepts can have **different types of labels**, depending on where they are displayed or what level of detail is needed. This flexibility allows XBRL-enabled software to show the most appropriate label for any given view. 📊\n\n" +
            "Here are the most common types of labels:\n\n" +
            "1.  **Standard Label** (`http://www.xbrl.org/2003/role/label`)\n" +
            "    - This is the **primary or default label**. ✅ It's usually a clear, commonly understood name for the concept.\n" +
            "    - *Use Case:* General display in a financial statement table.\n\n" +
            "2.  **Terse Label** (`http://www.xbrl.org/2003/role/terseLabel`)\n" +
            "    - This is a **short, concise label**, often used when space is limited (e.g., in a narrow column or a summary view). 🤏\n" +
            "    - *Use Case:* Column headers in a compact report, mobile views.\n\n" +
            "3.  **Verbose Label** (`http://www.xbrl.org/2003/role/verboseLabel`)\n" +
            "    - This is a **longer, more descriptive label** that provides additional context or explanation for the concept. 💬\n" +
            "    - *Use Case:* Tooltips, detailed disclosures, or explanations in complex reports.\n\n" +
            "**Example:** Labeling `NetIncomeLoss` with different roles:\n" +
            "```xml\n" +
            "<link:labelLink xlink:type=\"extended\" xlink:role=\"[http://www.xbrl.org/2003/role/labelLinkbase](http://www.xbrl.org/2003/role/labelLinkbase)\">\n" +
            "  <link:loc xlink:href=\"../taxonomy.xsd#ex_NetIncomeLoss\" xlink:type=\"locator\" xlink:label=\"loc_netIncome\"/>\n\n" +
            "  \n" +
            "  <link:label xlink:label=\"lab_netIncome_std\" xlink:type=\"resource\" xlink:role=\"[http://www.xbrl.org/2003/role/label](http://www.xbrl.org/2003/role/label)\">Net Income (Loss)</link:label>\n" +
            "  <link:labelArc xlink:from=\"loc_netIncome\" xlink:to=\"lab_netIncome_std\" xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/concept-label](http://www.xbrl.org/2003/arcrole/concept-label)\" xlink:type=\"arc\"/>\n\n" +
            "  \n" +
            "  <link:label xlink:label=\"lab_netIncome_trs\" xlink:type=\"resource\" xlink:role=\"[http://www.xbrl.org/2003/role/terseLabel](http://www.xbrl.org/2003/role/terseLabel)\">Net Inc.</link:label>\n" +
            "  <link:labelArc xlink:from=\"loc_netIncome\" xlink:to=\"lab_netIncome_trs\" xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/concept-label](http://www.xbrl.org/2003/arcrole/concept-label)\" xlink:type=\"arc\"/>\n\n" +
            "  \n" +
            "  <link:label xlink:label=\"lab_netIncome_vrb\" xlink:type=\"resource\" xlink:role=\"[http://www.xbrl.org/2003/role/verboseLabel](http://www.xbrl.org/2003/role/verboseLabel)\">Net income or loss attributable to the reporting entity</link:label>\n" +
            "  <link:labelArc xlink:from=\"loc_netIncome\" xlink:to=\"lab_netIncome_vrb\" xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/concept-label](http://www.xbrl.org/2003/arcrole/concept-label)\" xlink:type=\"arc\"/>\n\n" +
            "</link:labelLink>\n" +
            "```\n\n" +
            "**Key Elements in a Label Linkbase (Recap):**\n" +
            "- `<link:labelLink>`: The main container for label relationships.\n" +
            "- `<link:loc>`: Locators, which point to the concepts you want to label (e.g., `ex:NetIncomeLoss`).\n" +
            "- `<link:label>`: Defines the actual text of the label and its `xlink:role`.\n" +
            "- `<link:labelArc>`: Connects the concept (from `<link:loc>`) to its label (to `<link:label>`)."
  },
{
  "type": "code",
  "title": "💡 Activity 1: Create the Label Resource",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n  <xs:element name=\"RevenueFromContractsWithCustomers\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\" />\n</xs:schema>",
  "code": "<link:labelLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                xmlns:ex=\"http://example.com/taxonomy\"\n                xlink:type=\"extended\"\n                xlink:role=\"http://www.xbrl.org/2003/role/labelLinkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RevenueFromContractsWithCustomers\"\n            xlink:type=\"locator\"\n            xlink:label=\"loc_revenue\"/>\n\n  \n\n</link:labelLink>",
  "question": "💡 **Your Task:** Create the **`<link:label>` element** for the concept `ex:RevenueFromContractsWithCustomers`.\n\n- The label text should be: \"Revenue\"\n- It needs to be a **terse label**.\n\n**Sample structure of a `<link:label>` element:**\n```xml\n<link:label xlink:label=\"[your_internal_id]\" xlink:type=\"resource\" xlink:role=\"[label_role_URI]\">Your Label Text</link:label>\n```\n\n**Here’s how to complete this activity:**\n1.  **Locate the `` comment** in the XML code block.\n2.  **Inside this spot, write ONLY the XML for the `<link:label>` element.** Ensure it has:\n    * An `xlink:label` attribute (e.g., `\"lab_revenue_terse\"`). This is an internal ID you define.\n    * `xlink:type=\"resource\"` (because a label is a resource).\n    * The correct `xlink:role` URI for a **terse label**: `http://www.xbrl.org/2003/role/terseLabel`.\n    * The text content \"Revenue\" between its opening and closing tags.\n\n✏️ **Edit the XML above** to correctly define your terse label.",
  "hint": "Focus only on the `<link:label>` tag. Remember to set its `xlink:role` attribute to the specific URI for a terse label. The `xlink:label` attribute can be any unique string.",
  "validator": "validateLabelPart1",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:labelLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                xlink:type=\"extended\"\n                xlink:role=\"[http://www.xbrl.org/2003/role/labelLinkbase](http://www.xbrl.org/2003/role/labelLinkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RevenueFromContractsWithCustomers\"\n            xlink:type=\"locator\"\n            xlink:label=\"loc_revenue\"/>\n\n  <link:label xlink:label=\"lab_revenue_terse\"\n              xlink:type=\"resource\"\n              xlink:role=\"[http://www.xbrl.org/2003/role/terseLabel](http://www.xbrl.org/2003/role/terseLabel)\">Revenue</link:label>\n\n</link:labelLink>\n```\n\n**Explanation:**\n\n- We've correctly added the `<link:label>` element.\n- `xlink:label=\"lab_revenue_terse\"` provides a unique identifier for *this specific label* within the linkbase.\n- `xlink:type=\"resource\"` correctly identifies this element as a resource that will be linked *to*.\n- `xlink:role=\"http://www.xbrl.org/2003/role/terseLabel\"` explicitly tells XBRL that this is the short, concise version of the label.\n- The text \"Revenue\" is the actual human-readable label."
},
{
  "type": "code",
  "title": "💡 Activity 2: Connect the Label",
  "taxonomy": "<xs:schema xmlns:xs=\"[http://www.w3.org/2001/XMLSchema](http://www.w3.org/2001/XMLSchema)\"\n           xmlns:xbrli=\"[http://www.xbrl.org/2003/instance](http://www.xbrl.org/2003/instance)\"\n           xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n           targetNamespace=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n  <xs:element name=\"RevenueFromContractsWithCustomers\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\" />\n</xs:schema>",
  "code": "<link:labelLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                xlink:type=\"extended\"\n                xlink:role=\"[http://www.xbrl.org/2003/role/labelLinkbase](http://www.xbrl.org/2003/role/labelLinkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RevenueFromContractsWithCustomers\"\n            xlink:type=\"locator\"\n            xlink:label=\"loc_revenue\"/>\n\n  <link:label xlink:label=\"lab_revenue_terse\"\n              xlink:type=\"resource\"\n              xlink:role=\"[http://www.xbrl.org/2003/role/terseLabel](http://www.xbrl.org/2003/role/terseLabel)\">Revenue</link:label>\n\n  \n\n</link:labelLink>",
  "question": "💡 **Your Task:** Now, create the **`<link:labelArc>` element** to connect the concept `ex:RevenueFromContractsWithCustomers` to the terse label you just created.\n\n- The concept's locator has `xlink:label=\"loc_revenue\"`.\n- Your terse label has `xlink:label=\"lab_revenue_terse\"`.\n\n**Sample structure of a `<link:labelArc>` element:**\n```xml\n<link:labelArc xlink:from=\"[source_xlink:label]\" xlink:to=\"[target_xlink:label]\" xlink:arcrole=\"[arcrole_URI]\" xlink:type=\"arc\"/>\n```\n\n**Here’s how to complete this activity:**\n1.  **Locate the `` comment** in the XML code block.\n2.  **Inside this spot, write ONLY the XML for the `<link:labelArc>` element.** Ensure it has:\n    * `xlink:from=\"loc_revenue\"` (pointing to the concept).\n    * `xlink:to=\"lab_revenue_terse\"` (pointing to your label).\n    * `xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/concept-label\"` (the standard arcrole for concept-label relationships).\n    * `xlink:type=\"arc\"`.\n\n✏️ **Edit the XML above** to correctly connect your concept and label.",
  "hint": "The `xlink:from` attribute always points to the source of the arc (the concept locator), and `xlink:to` points to the target (your label resource).",
  "validator": "validateLabelPart2",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:labelLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                xmlns:ex=\"http://example.com/taxonomy\"\n                xlink:type=\"extended\"\n                xlink:role=\"http://www.xbrl.org/2003/role/labelLinkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RevenueFromContractsWithCustomers\"\n            xlink:type=\"locator\"\n            xlink:label=\"loc_revenue\"/>\n\n  <link:label xlink:label=\"lab_revenue_terse\"\n              xlink:type=\"resource\"\n              xlink:role=\"http://www.xbrl.org/2003/role/terseLabel\">Revenue</link:label>\n\n  <link:labelArc xlink:from=\"loc_revenue\"\n                 xlink:to=\"lab_revenue_terse\"\n                 xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/concept-label\"\n                 xlink:type=\"arc\"/>\n\n</link:labelLink>\n```\n\n**Explanation:**\n\n- We've correctly added the `<link:labelArc>` element.\n- `xlink:from=\"loc_revenue\"` correctly points to the `xlink:label` of the concept's locator, making the concept the source of the relationship.\n- `xlink:to=\"lab_revenue_terse\"` correctly points to the `xlink:label` of the label resource we created in the previous step, making the label the target of the relationship.\n- `xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/concept-label\"` is the standard arc role used to define that a concept has a label."
},
{
  "type": "knowledge",
  "title": "📋 Presentation Linkbase: Structuring Your Report",
  "text": "The **Presentation Linkbase** 📋 organizes how financial concepts appear in a report. It defines the **hierarchy** (parent-child relationships) and the **display order** of concepts, making statements easy to read and understand.\n\n" +
          "Think of it as the table of contents or the structure of a financial statement, showing which items are subtotals and which are components. 🏗️\n\n" +
          "**Example:** Showing `Cash` and `Inventory` under `Assets`:\n" +
          "```xml\n" +
          "<link:presentationLink xlink:type=\"extended\" xlink:role=\"[http://www.xbrl.org/2003/role/statementOfFinancialPosition](http://www.xbrl.org/2003/role/statementOfFinancialPosition)\">\n" +
          "  <link:loc xlink:href=\"../taxonomy.xsd#ex_Assets\" xlink:type=\"locator\" xlink:label=\"loc_Assets\"/>\n" +
          "  <link:loc xlink:href=\"../taxonomy.xsd#ex_Cash\" xlink:type=\"locator\" xlink:label=\"loc_Cash\"/>\n" +
          "  <link:loc xlink:href=\"../taxonomy.xsd#ex_Inventory\" xlink:type=\"locator\" xlink:label=\"loc_Inventory\"/>\n\n" +
          "  <link:presentationArc xlink:from=\"loc_Assets\" xlink:to=\"loc_Cash\" \n" +
          "                        xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/parent-child](http://www.xbrl.org/2003/arcrole/parent-child)\" order=\"1\"/>\n" +
          "  <link:presentationArc xlink:from=\"loc_Assets\" xlink:to=\"loc_Inventory\" \n" +
          "                        xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/parent-child](http://www.xbrl.org/2003/arcrole/parent-child)\" order=\"2\"/>\n" +
          "</link:presentationLink>\n" +
          "```\n\n" +
          "**Key Elements in a Presentation Linkbase:**\n" +
          "- `<link:presentationLink>`: The main container.\n" +
          "- `<link:loc>`: Locators, pointing to the concepts (e.g., `ex:Assets`, `ex:Cash`).\n" +
          "- `<link:presentationArc>`: The core element that defines the parent-child relationship.\n" +
          "  - `xlink:from`: Points to the **parent** concept. ⬆️\n" +
          "  - `xlink:to`: Points to the **child** concept. ⬇️\n" +
          "  - `xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/parent-child\"`: This specific arcrole signifies a hierarchical relationship. 🔗\n" +
          "  - **Understanding the `order` Attribute: 🔢**\n    -   **Purpose:** The `order` attribute is crucial in presentation linkbases (and other linkbases like calculation) to specify the desired display sequence of concepts that are siblings under the same parent.\n    -   **Mechanism:** XBRL processors sort sibling arcs based on their `order` attribute values in ascending numerical order. Concepts linked by arcs with lower `order` values will appear before those with higher values.\n    -   **Best Practice (Flexibility):** It's common practice to use increments (e.g., `10, 20, 30` or `100, 200, 300`) rather than consecutive numbers (`1, 2, 3`). This leaves gaps (e.g., `11-19`, `21-29`) allowing you to easily insert new concepts later without having to renumber existing ones.\n    -   **Default Behavior:** If the `order` attribute is omitted, the display order of siblings can be unpredictable or may default to an alphabetical sort based on the concept name, which is generally not desired for structured presentation."
},
{
  "type": "code",
  "title": "💡 Activity 1: Link Parent to First Child",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n  <xs:element name=\"TotalOperatingExpenses\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"SalariesAndWages\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"RentExpense\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n</xs:schema>",
  "code": "<link:presentationLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                           xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                           xmlns:ex=\"http://example.com/taxonomy\"\n                           xlink:type=\"extended\"\n                           xlink:role=\"http://www.xbrl.org/2003/role/linkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_TotalOperatingExpenses\" xlink:type=\"locator\" xlink:label=\"loc_TotalOperatingExpenses\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_SalariesAndWages\" xlink:type=\"locator\" xlink:label=\"loc_SalariesAndWages\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RentExpense\" xlink:type=\"locator\" xlink:label=\"loc_RentExpense\"/>\n\n  <link:presentationArc xlink:from=\"REPLACE_WITH_PARENT_LOCATOR\" xlink:to=\"REPLACE_WITH_CHILD_LOCATOR\" xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/parent-child\" xlink:type=\"arc\" order=\"REPLACE_WITH_ORDER_NUMBER\"/>\n  \n\n</link:presentationLink>",
  "question": "**Your Task:** Create the **first `<link:presentationArc>` element** to show that `ex:SalariesAndWages` is a child of `ex:TotalOperatingExpenses`.\n\n- The parent concept's locator is `loc_TotalOperatingExpenses`.\n- The child concept's locator is `loc_SalariesAndWages`.\n- Use the standard `xlink:arcrole` for parent-child relationships.\n- Set its `order` attribute to `10` (a common starting point).\n\n",
  "hint": "The `xlink:from` and `xlink:to` attributes refer to the `xlink:label`s of the `loc` elements. The `order` attribute is a numeric value that defines display sequence.",
  "validator": "validatePresentationPart1",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:presentationLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                           xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                           xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                           xlink:type=\"extended\"\n                           xlink:role=\"[http://www.xbrl.org/2003/role/linkbase](http://www.xbrl.org/2003/role/linkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_TotalOperatingExpenses\" xlink:type=\"locator\" xlink:label=\"loc_TotalOperatingExpenses\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_SalariesAndWages\" xlink:type=\"locator\" xlink:label=\"loc_SalariesAndWages\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RentExpense\" xlink:type=\"locator\" xlink:label=\"loc_RentExpense\"/>\n\n  <link:presentationArc xlink:from=\"loc_TotalOperatingExpenses\" xlink:to=\"loc_SalariesAndWages\"\n                            xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/parent-child](http://www.xbrl.org/2003/arcrole/parent-child)\" xlink:type=\"arc\" order=\"10\"/>\n\n</link:presentationLink>\n```\n\n**Explanation:**\n\n- The `<link:presentationArc>` element correctly establishes a relationship.\n- `xlink:from=\"loc_TotalOperatingExpenses\"` identifies the parent in the hierarchy.\n- `xlink:to=\"loc_SalariesAndWages\"` identifies the child in the hierarchy.\n- `xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/parent-child\"` specifies the type of relationship (a standard parent-child link).\n- `xlink:type=\"arc\"` is standard for all XBRL arcs.\n- `order=\"10\"` places `SalariesAndWages` as the first item under `TotalOperatingExpenses`."
},
{
  "type": "code",
  "title": "💡 Activity 2: Add Second Child with Order",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n  <xs:element name=\"TotalOperatingExpenses\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"SalariesAndWages\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"RentExpense\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n</xs:schema>",
  "code": "<link:presentationLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                           xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                           xmlns:ex=\"http://example.com/taxonomy\"\n                           xlink:type=\"extended\"\n                           xlink:role=\"http://www.xbrl.org/2003/role/linkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_TotalOperatingExpenses\" xlink:type=\"locator\" xlink:label=\"loc_TotalOperatingExpenses\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_SalariesAndWages\" xlink:type=\"locator\" xlink:label=\"loc_SalariesAndWages\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RentExpense\" xlink:type=\"locator\" xlink:label=\"loc_RentExpense\"/>\n\n  <link:presentationArc xlink:from=\"loc_TotalOperatingExpenses\" xlink:to=\"loc_SalariesAndWages\"\n                            xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/parent-child\" xlink:type=\"arc\" order=\"10\"/>\n\n  \n  \n\n</link:presentationLink>",
  "question": "💡 **Your Task:** Create the **second `<link:presentationArc>` element** to show that `ex:RentExpense` is also a child of `ex:TotalOperatingExpenses`.\n\n- The parent concept's locator is `loc_TotalOperatingExpenses`.\n- The child concept's locator is `loc_RentExpense`.\n- Use the standard `xlink:arcrole` for parent-child relationships.\n- **Crucially:** Set its `order` attribute so that `RentExpense` appears *after* `SalariesAndWages` (which has `order=\"10\"`). A good practice is to increment by 10 or 100.\n\n",
  "validator": "validatePresentationPart2",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:presentationLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                           xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                           xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                           xlink:type=\"extended\"\n                           xlink:role=\"[http://www.xbrl.org/2003/role/linkbase](http://www.xbrl.org/2003/role/linkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_TotalOperatingExpenses\" xlink:type=\"locator\" xlink:label=\"loc_TotalOperatingExpenses\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_SalariesAndWages\" xlink:type=\"locator\" xlink:label=\"loc_SalariesAndWages\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_RentExpense\" xlink:type=\"locator\" xlink:label=\"loc_RentExpense\"/>\n\n  <link:presentationArc xlink:from=\"loc_TotalOperatingExpenses\" xlink:to=\"loc_SalariesAndWages\"\n                            xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/parent-child](http://www.xbrl.org/2003/arcrole/parent-child)\" xlink:type=\"arc\" order=\"10\"/>\n\n  <link:presentationArc xlink:from=\"loc_TotalOperatingExpenses\" xlink:to=\"loc_RentExpense\"\n                            xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/parent-child](http://www.xbrl.org/2003/arcrole/parent-child)\" xlink:type=\"arc\" order=\"20\"/>\n\n</link:presentationLink>\n```\n\n**Explanation:**\n\n- We've added the second `<link:presentationArc>` for `RentExpense`.\n- It correctly links `loc_TotalOperatingExpenses` as the parent to `loc_RentExpense` as the child.\n- The `order=\"20\"` attribute is crucial here. Since `SalariesAndWages` has an `order` of `10`, setting `RentExpense`'s `order` to `20` (or any value greater than 10) ensures that `RentExpense` is displayed *after* `SalariesAndWages` under `TotalOperatingExpenses`."
},
  {
    "type": "knowledge",
    "title": "➕➖ Calculation Linkbase: Ensuring Mathematical Accuracy",
    "text": "The **Calculation Linkbase** ➕➖ is essential for defining **mathematical relationships** between numerical concepts. It ensures that your financial data is **consistent and adds up correctly**.\n\n" +
            "It defines rules like 'A + B = C' or 'Total = Sum of parts'. 🧮\n\n" +
            "**Example:** `TotalAssets` is the sum of `Cash` and `Inventory`:\n" +
            "```xml\n" +
            "<link:calculationLink xlink:type=\"extended\" xlink:role=\"[http://www.xbrl.org/2003/role/calculationLinkbase](http://www.xbrl.org/2003/role/calculationLinkbase)\">\n" +
            "  <link:loc xlink:href=\"../taxonomy.xsd#ex_TotalAssets\" xlink:type=\"locator\" xlink:label=\"loc_TotalAssets\"/>\n" +
            "  <link:loc xlink:href=\"../taxonomy.xsd#ex_Cash\" xlink:type=\"locator\" xlink:label=\"loc_Cash\"/>\n" +
            "  <link:loc xlink:href=\"../taxonomy.xsd#ex_Inventory\" xlink:type=\"locator\" xlink:label=\"loc_Inventory\"/>\n\n" +
            "  <link:calculationArc xlink:from=\"loc_TotalAssets\" xlink:to=\"loc_Cash\" \n" +
            "                       xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/summation-item](http://www.xbrl.org/2003/arcrole/summation-item)\" weight=\"1\"/>\n" +
            "  <link:calculationArc xlink:from=\"loc_TotalAssets\" xlink:to=\"loc_Inventory\" \n" +
            "                       xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/summation-item](http://www.xbrl.org/2003/arcrole/summation-item)\" weight=\"1\"/>\n" +
            "</link:calculationLink>\n" +
            "```\n\n" +
            "**Key Elements in a Calculation Linkbase:**\n" +
            "- `<link:calculationLink>`: The main container.\n" +
            "- `<link:loc>`: Locators, pointing to the numerical concepts.\n" +
            "- `<link:calculationArc>`: Defines the mathematical relationship.\n" +
            "  - `xlink:from`: Points to the **summing concept** (the total).\n" +
            "  - `xlink:to`: Points to a **contributing concept** (a part of the total).\n" +
            "  - `xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/summation-item\"`: This specific arcrole means 'the `from` concept is the sum of (or impacted by) the `to` concept'. 🔗\n" +
            "  - `weight`: A crucial attribute! It defines how the `to` concept affects the `from` concept:\n" +
            "    - `weight=\"1\"`: The `to` concept is **added** to the `from` concept. ✅\n" +
            "    - `weight=\"-1\"`: The `to` concept is **subtracted** from the `from` concept. ⛔"
  },
 {
  "type": "code",
  "title": "💡 Activity 1: Link Total to Component (Addition)",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n  <xs:element name=\"NetIncome\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"Revenue\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"CostOfGoodsSold\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n</xs:schema>",
  "code": "<link:calculationLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                            xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                            xmlns:ex=\"http://example.com/taxonomy\"\n                            xlink:type=\"extended\"\n                            xlink:role=\"http://www.xbrl.org/2003/role/calculationLinkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_NetIncome\" xlink:type=\"locator\" xlink:label=\"loc_NetIncome\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_Revenue\" xlink:type=\"locator\" xlink:label=\"loc_Revenue\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_CostOfGoodsSold\" xlink:type=\"locator\" xlink:label=\"loc_CostOfGoodsSold\"/>\n\n  \n  <link:calculationArc xlink:from=\"[TOTAL_CONCEPT_LOCATOR]\" xlink:to=\"[COMPONENT_CONCEPT_LOCATOR]\"\n                       xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/summation-item\" xlink:type=\"arc\" weight=\"[WEIGHT_VALUE]\"/>\n\n</link:calculationLink>",
  "question": "💡 **Your Task:** Create the **first `<link:calculationArc>` element** to represent `Revenue` in the formula `NetIncome = Revenue - CostOfGoodsSold`.\n\n- The total concept's locator is `loc_NetIncome`.\n- The component concept's locator is `loc_Revenue`.\n- Use the standard `xlink:arcrole` for summation-item relationships.\n- Set its `weight` attribute to `1` (for addition).\n\n**Sample structure of a `<link:calculationArc>` element (also provided in the code!):**\n```xml\n<link:calculationArc xlink:from=\"[total_locator_label]\" xlink:to=\"[component_locator_label]\" xlink:arcrole=\"[arcrole_URI]\" xlink:type=\"arc\" weight=\"[number]\"/>\n```\n\n**Here’s how to complete this activity:**\n1.  **Locate the `` comment** in the XML code block.\n2.  **Replace the sample `<link:calculationArc>` element directly below the comment.** Fill in the correct values for:\n    * `xlink:from` pointing to `loc_NetIncome`.\n    * `xlink:to` pointing to `loc_Revenue`.\n    * `xlink:arcrole` (this is already set to `http://www.xbrl.org/2003/arcrole/summation-item` in the sample).\n    * `xlink:type` (this is already set to `arc` in the sample).\n    * `weight` set to `1`.\n\n✏️ **Edit the XML above** to correctly define the first part of your calculation.",
  "hint": "The `xlink:from` points to the concept that is the sum (e.g., NetIncome), and `xlink:to` points to a component that contributes to that sum (e.g., Revenue). Use `weight=\"1\"` for addition.",
  "validator": "validateCalculationPart1",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:calculationLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                            xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                            xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                            xlink:type=\"extended\"\n                            xlink:role=\"[http://www.xbrl.org/2003/role/calculationLinkbase](http://www.xbrl.org/2003/role/calculationLinkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_NetIncome\" xlink:type=\"locator\" xlink:label=\"loc_NetIncome\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_Revenue\" xlink:type=\"locator\" xlink:label=\"loc_Revenue\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_CostOfGoodsSold\" xlink:type=\"locator\" xlink:label=\"loc_CostOfGoodsSold\"/>\n\n  <link:calculationArc xlink:from=\"loc_NetIncome\" xlink:to=\"loc_Revenue\"\n                            xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/summation-item](http://www.xbrl.org/2003/arcrole/summation-item)\" xlink:type=\"arc\" weight=\"1\"/>\n\n</link:calculationLink>\n```\n\n**Explanation:**\n\n- The `<link:calculationArc>` correctly links `NetIncome` as the sum to `Revenue` as a contributing item.\n- `xlink:from=\"loc_NetIncome\"` specifies the concept that is the calculated total.\n- `xlink:to=\"loc_Revenue\"` specifies the concept that contributes to that total.\n- `xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/summation-item\"` is the standard arcrole for calculation relationships.\n- `xlink:type=\"arc\"` is standard for all XBRL arcs.\n- `weight=\"1\"` indicates that `Revenue` is added to the sum."
},
{
  "type": "code",
  "title": "💡 Activity 2: Add Second Component (Subtraction)",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n  <xs:element name=\"NetIncome\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"Revenue\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n  <xs:element name=\"CostOfGoodsSold\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n</xs:schema>",
  "code": "<link:calculationLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                            xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                            xmlns:ex=\"http://example.com/taxonomy\"\n                            xlink:type=\"extended\"\n                            xlink:role=\"http://www.xbrl.org/2003/role/calculationLinkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_NetIncome\" xlink:type=\"locator\" xlink:label=\"loc_NetIncome\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_Revenue\" xlink:type=\"locator\" xlink:label=\"loc_Revenue\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_CostOfGoodsSold\" xlink:type=\"locator\" xlink:label=\"loc_CostOfGoodsSold\"/>\n\n  <link:calculationArc xlink:from=\"loc_NetIncome\" xlink:to=\"loc_Revenue\"\n                            xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/summation-item\" xlink:type=\"arc\" weight=\"1\"/>\n\n  \n  <link:calculationArc xlink:from=\"[TOTAL_CONCEPT_LOCATOR]\" xlink:to=\"[COMPONENT_CONCEPT_LOCATOR]\"\n                       xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/summation-item\" \n                       xlink:type=\"arc\" weight=\"[WEIGHT_VALUE]\"/>\n\n</link:calculationLink>",
  "question": "💡 **Your Task:** Create the **second `<link:calculationArc>` element** to represent `CostOfGoodsSold` in the formula `NetIncome = Revenue - CostOfGoodsSold`.\n\n- The total concept's locator is `loc_NetIncome`.\n- The component concept's locator is `loc_CostOfGoodsSold`.\n- Use the standard `xlink:arcrole` for summation-item relationships.\n- **Crucially:** Set its `weight` attribute to `-1` (for subtraction).\n\n**Sample structure of a `<link:calculationArc>` element (also provided in the code!):**\n```xml\n<link:calculationArc xlink:from=\"[total_locator_label]\" xlink:to=\"[component_locator_label]\" xlink:arcrole=\"[arcrole_URI]\" xlink:type=\"arc\" weight=\"[number]\"/>\n```\n\n✏️ **Edit the XML above** to correctly define the subtraction part of your calculation.",
  "hint": "For items that subtract from the total, the `weight` attribute should be `-1`. The `xlink:from` still points to the sum, and `xlink:to` to the component.",
  "validator": "validateCalculationPart2",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:calculationLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                            xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                            xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                            xlink:type=\"extended\"\n                            xlink:role=\"[http://www.xbrl.org/2003/role/calculationLinkbase](http://www.xbrl.org/2003/role/calculationLinkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_NetIncome\" xlink:type=\"locator\" xlink:label=\"loc_NetIncome\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_Revenue\" xlink:type=\"locator\" xlink:label=\"loc_Revenue\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_CostOfGoodsSold\" xlink:type=\"locator\" xlink:label=\"loc_CostOfGoodsSold\"/>\n\n  <link:calculationArc xlink:from=\"loc_NetIncome\" xlink:to=\"loc_Revenue\"\n                            xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/summation-item](http://www.xbrl.org/2003/arcrole/summation-item)\" xlink:type=\"arc\" weight=\"1\"/>\n\n  <link:calculationArc xlink:from=\"loc_NetIncome\" xlink:to=\"loc_CostOfGoodsSold\"\n                            xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/summation-item](http://www.xbrl.org/2003/arcrole/summation-item)\" xlink:type=\"arc\" weight=\"-1\"/>\n\n</link:calculationLink>\n```\n\n**Explanation:**\n\n- We've added the second `<link:calculationArc>` for `CostOfGoodsSold`.\n- It correctly links `NetIncome` as the sum to `CostOfGoodsSold` as a component.\n- The `weight=\"-1\"` is crucial here, as it indicates that `CostOfGoodsSold` is subtracted from the sum `NetIncome`."
},
  {
    "type": "knowledge",
    "title": "🧭 Definition Linkbase: Defining Advanced Relationships (Dimensions!)",
    "text": "The **Definition Linkbase** 🧭 is a powerful tool for defining relationships that don't fit into the simple presentation (hierarchy) or calculation (math) categories.\n\n" +
            "Its **most common and crucial use is for XBRL Dimensions**. It establishes the rules for how dimension axes (like `RegionAxis`) relate to their specific members (like `AsiaMember`). 🔗\n\n" +
            "**Example:** Linking `ProductCategoryAxis` to its member `ElectronicsMember`:\n" +
            "```xml\n" +
            "<link:definitionLink xlink:type=\"extended\" xlink:role=\"[http://www.xbrl.org/2003/role/definitionLinkbase](http://www.xbrl.org/2003/role/definitionLinkbase)\">\n" +
            "  <link:loc xlink:href=\"../taxonomy.xsd#ex_ProductCategoryAxis\" xlink:type=\"locator\" xlink:label=\"loc_ProdCatAxis\"/>\n" +
            "  <link:loc xlink:href=\"../taxonomy.xsd#ex_ElectronicsMember\" xlink:type=\"locator\" xlink:label=\"loc_ElectronicsMember\"/>\n\n" +
            "  <link:definitionArc xlink:from=\"loc_ProdCatAxis\" xlink:to=\"loc_ElectronicsMember\" \n" +
            "                      xlink:arcrole=\"[http://xbrl.org/2003/arcrole/domain-member](http://xbrl.org/2003/arcrole/domain-member)\"/>\n" +
            "</link:definitionLink>\n" +
            "```\n\n" +
            "**Key Elements in a Definition Linkbase:**\n" +
            "- `<link:definitionLink>`: The main container.\n" +
            "- `<link:loc>`: Locators, pointing to the concepts (e.g., a dimension axis, a dimension member).\n" +
            "- `<link:definitionArc>`: Defines the relationship.\n" +
            "  - `xlink:from`: Usually points to the **dimension axis** (the category).\n" +
            "  - `xlink:to`: Usually points to a **dimension member** (a specific value in that category).\n" +
            "  - `xlink:arcrole=\"http://xbrl.org/2003/arcrole/domain-member\"`: This specific arcrole is used to link a dimension axis to its allowed members. 🎯\n\n" +
            "The Definition Linkbase is how you tell XBRL which specific choices are allowed for each of your Explicit Dimensions. ✅"
  },
  {
  "type": "code",
  "title": "🔗 Activity: Connect Your Dimensions!",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n           xmlns:xbrldt=\"http://xbrl.org/2005/xbrldt\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n\n  \n  <xs:element name=\"GeographicRegionAxis\" type=\"xbrldt:dimensionItemType\" substitutionGroup=\"xbrli:item\"/>\n\n  \n  <xs:element name=\"EuropeMember\" type=\"xbrli:stringItemType\" substitutionGroup=\"xbrli:item\"/>\n\n  \n  <xs:element name=\"GeographicRegionDomain\" type=\"xbrli:stringItemType\" substitutionGroup=\"xbrli:item\"/>\n\n</xs:schema>",
  "code": "<link:definitionLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                             xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                             xmlns:xbrldt=\"http://xbrl.org/2005/xbrldt\"\n                             xmlns:ex=\"http://example.com/taxonomy\"\n                             xlink:type=\"extended\"\n                             xlink:role=\"http://www.xbrl.org/2003/role/definitionLinkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_GeographicRegionAxis\" xlink:type=\"locator\" xlink:label=\"loc_GeoRegionAxis\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_EuropeMember\" xlink:type=\"locator\" xlink:label=\"loc_EuropeMember\"/>\n\n  \n  <link:definitionArc xlink:from=\"[AXIS_LOCATOR]\" xlink:to=\"[MEMBER_LOCATOR]\"\n                        xlink:arcrole=\"http://xbrl.org/2005/arcrole/domain-member\" xlink:type=\"arc\"/>\n\n</link:definitionLink>",
  "question": "💡 **Your Task:** Create the **`<link:definitionArc>` element** to connect your `ex:GeographicRegionAxis` to its member `ex:EuropeMember`.\n\n- The dimension axis locator is `loc_GeoRegionAxis`.\n- The dimension member locator is `loc_EuropeMember`.\n- Use the specific `xlink:arcrole` for `domain-member` relationships: `http://xbrl.org/2005/arcrole/domain-member`.\n\n**Sample structure of a `<link:definitionArc>` element (also provided in the code!):**\n```xml\n<link:definitionArc xlink:from=\"[axis_locator_label]\" xlink:to=\"[member_locator_label]\" xlink:arcrole=\"[domain_member_arcrole_URI]\" xlink:type=\"arc\"/>\n```\n\n**Here’s how to complete this activity:**\n1.  **Locate the `` comment** in the XML code block.\n2.  **Replace the sample `<link:definitionArc>` element directly below the comment.** Fill in the correct values for:\n    * `xlink:from` pointing to `loc_GeoRegionAxis`.\n    * `xlink:to` pointing to `loc_EuropeMember`.\n    * `xlink:arcrole` (this is already set to `http://xbrl.org/2005/arcrole/domain-member` in the sample).\n    * `xlink:type` (this is already set to `arc` in the sample).\n\n✏️ **Edit the XML above** to correctly connect your dimension.\n",
  "hint": "Remember that for `domain-member` arcs, the `xlink:from` attribute points to the **dimension axis**, and `xlink:to` points to the **dimension member**. The `arcrole` is already provided for you.",
  "validator": "validateDefinitionDomainMember",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:definitionLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                             xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                             xmlns:xbrldt=\"[http://xbrl.org/2005/xbrldt](http://xbrl.org/2005/xbrldt)\"\n                             xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                             xlink:type=\"extended\"\n                             xlink:role=\"[http://www.xbrl.org/2003/role/definitionLinkbase](http://www.xbrl.org/2003/role/definitionLinkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_GeographicRegionAxis\" xlink:type=\"locator\" xlink:label=\"loc_GeoRegionAxis\"/>\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_EuropeMember\" xlink:type=\"locator\" xlink:label=\"loc_EuropeMember\"/>\n\n  <link:definitionArc xlink:from=\"loc_GeoRegionAxis\" xlink:to=\"loc_EuropeMember\"\n                        xlink:arcrole=\"[http://xbrl.org/2005/arcrole/domain-member](http://xbrl.org/2005/arcrole/domain-member)\" xlink:type=\"arc\"/>\n\n</link:definitionLink>\n```\n\n**Explanation:**\n\n-   The `<link:definitionArc>` element is used to define relationships beyond presentation and calculation, specifically for dimensions here.\n-   `xlink:from=\"loc_GeoRegionAxis\"` correctly points to the dimension axis, establishing it as the domain.\n-   `xlink:to=\"loc_EuropeMember\"` correctly points to the dimension member, indicating it belongs to the domain of the `GeographicRegionAxis`.\n-   `xlink:arcrole=\"http://xbrl.org/2005/arcrole/domain-member\"` is the standard arcrole used to define this axis-to-member relationship in XBRL Dimensions 1.0.\n-   `xlink:type=\"arc\"` is standard for all XBRL arcs."
},
  {
    "type": "knowledge",
    "title": "📚 Reference Linkbase: Citing Authoritative Guidance",
    "text": "The **Reference Linkbase** 📚 connects specific XBRL concepts to their **authoritative definitions or guidance** from official sources.\n\n" +
            "Think of it as adding a footnote or a citation to each financial concept, showing where its meaning comes from (e.g., a specific paragraph in a GAAP or IFRS standard). 📜\n\n" +
            "**Example:** Linking `LeaseLiability` to ASC 842, Paragraph 25:\n" +
            "```xml\n" +
            "<link:referenceLink xlink:type=\"extended\" xlink:role=\"[http://www.xbrl.org/2003/role/referenceLinkbase](http://www.xbrl.org/2003/role/referenceLinkbase)\">\n" +
            "  <link:loc xlink:href=\"../taxonomy.xsd#ex_LeaseLiability\" xlink:type=\"locator\" xlink:label=\"loc_leaseLiab\"/>\n" +
            "  <link:reference xlink:label=\"ref_leaseLiab\" xlink:type=\"resource\" xlink:role=\"[http://www.xbrl.org/2003/role/definitionReference](http://www.xbrl.org/2003/role/definitionReference)\">\n" +
            "    <ref:Standard>ASC 842</ref:Standard>\n" +
            "    <ref:Paragraph>25</ref:Paragraph>\n" +
            "  </link:reference>\n" +
            "  <link:referenceArc xlink:from=\"loc_leaseLiab\" xlink:to=\"ref_leaseLiab\" \n" +
            "                     xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/concept-reference](http://www.xbrl.org/2003/arcrole/concept-reference)\" xlink:type=\"arc\"/>\n" +
            "</link:referenceLink>\n" +
            "```\n\n" +
            "**Key Elements in a Reference Linkbase:**\n" +
            "- `<link:referenceLink>`: The main container.\n" +
            "- `<link:loc>`: Locators, pointing to the concepts (e.g., `ex:LeaseLiability`).\n" +
            "- `<link:reference>`: Defines the details of the external reference. It can contain various sub-elements like `<ref:Standard>`, `<ref:Paragraph>`, `<ref:URI>`, etc.\n" +
            "- `<link:referenceArc>`: Connects the concept (from `<link:loc>`) to its reference (to `<link:reference>`).\n" +
            "  - `xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/concept-reference\"`: This arcrole signifies that a concept is defined or supported by a reference. 🔗"
  },
  {
  "type": "code",
  "title": "📄 Activity: Cite the Source!",
  "taxonomy": "<xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"\n           xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"\n           xmlns:ex=\"http://example.com/taxonomy\"\n           targetNamespace=\"http://example.com/taxonomy\"\n           elementFormDefault=\"qualified\" attributeFormDefault=\"unqualified\">\n  <xs:element name=\"Revenue\" type=\"xbrli:monetaryItemType\" substitutionGroup=\"xbrli:item\"/>\n</xs:schema>",
  "code": "<link:referenceLink xmlns:link=\"http://www.xbrl.org/2003/linkbase\"\n                            xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n                            xmlns:ref=\"http://www.xbrl.org/2003/ref\"\n                            xmlns:ex=\"http://example.com/taxonomy\"\n                            xlink:type=\"extended\"\n                            xlink:role=\"http://www.xbrl.org/2003/role/referenceLinkbase\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_Revenue\" xlink:type=\"locator\" xlink:label=\"loc_Revenue\"/>\n\n  \n  <link:reference xlink:role=\"http://www.xbrl.org/2003/role/reference\" xlink:type=\"resource\">\n    <ref:Standard>[STANDARD_VALUE]</ref:Standard>\n    <ref:Paragraph>[PARAGRAPH_VALUE]</ref:Paragraph>\n  </link:reference>\n\n  <link:referenceArc xlink:from=\"loc_Revenue\" xlink:to=\"[REFERENCE_LABEL]\"\n                       xlink:arcrole=\"http://www.xbrl.org/2003/arcrole/concept-reference\" xlink:type=\"arc\"/>\n\n</link:referenceLink>",
  "question": "💡 **Your Task:** You need to add a reference to the concept `ex:Revenue`.\n\n**Scenario:** The definition for `Revenue` comes from **IFRS 15, Paragraph 10**.\n\n**Task:** Replace the sample `<link:reference>` XML snippet. Make sure to include both the `Standard` and `Paragraph` details.\n\n- The concept's locator is `loc_Revenue`.\n- The `link:reference` resource itself needs an `xlink:label` (e.g., `ref_RevenueIFRS15`).\n- The `Standard` is `IFRS 15`.\n- The `Paragraph` is `10`.\n- The `link:referenceArc` needs to link `loc_Revenue` to your reference's label.\n\n**Here’s how to complete this activity:**\n1.  **Locate the `` comment** in the XML code block.\n2.  **Replace the sample `<link:reference>` element and adjust the `link:referenceArc` directly below the comment.**\n    * **For the `<link:reference>`:**\n        * Add an `xlink:label` (e.g., `ref_RevenueIFRS15`).\n        * Set the content of `<ref:Standard>` to `IFRS 15`.\n        * Set the content of `<ref:Paragraph>` to `10`.\n    * **For the `<link:referenceArc>`:**\n        * Ensure `xlink:from` points to `loc_Revenue`.\n        * Ensure `xlink:to` points to the `xlink:label` you assigned to your `link:reference` (e.g., `ref_RevenueIFRS15`).\n        * The `xlink:arcrole` should be `http://www.xbrl.org/2003/arcrole/concept-reference` (already provided).\n        * The `xlink:type` should be `arc` (already provided).\n\n✏️ **Edit the XML above** to correctly cite the source for `Revenue`.",
  "hint": "The `link:reference` element is a resource, so it needs an `xlink:label`. The `link:referenceArc` then links your concept (`xlink:from`) to that reference resource (`xlink:to`). Remember to fill in the `ref:Standard` and `ref:Paragraph` values.",
  "validator": "validateReferencePart1",
  "explanation": "✅ **Correct Solution:**\n\n```xml\n<link:referenceLink xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\"\n                            xmlns:xlink=\"[http://www.w3.org/1999/xlink](http://www.w3.org/1999/xlink)\"\n                            xmlns:ref=\"[http://www.xbrl.org/2003/ref](http://www.xbrl.org/2003/ref)\"\n                            xmlns:ex=\"[http://example.com/taxonomy](http://example.com/taxonomy)\"\n                            xlink:type=\"extended\"\n                            xlink:role=\"[http://www.xbrl.org/2003/role/referenceLinkbase](http://www.xbrl.org/2003/role/referenceLinkbase)\">\n  <link:loc xlink:href=\"../taxonomy.xsd#ex_Revenue\" xlink:type=\"locator\" xlink:label=\"loc_Revenue\"/>\n\n  <link:reference xlink:role=\"[http://www.xbrl.org/2003/role/reference](http://www.xbrl.org/2003/role/reference)\" xlink:type=\"resource\" xlink:label=\"ref_RevenueIFRS15\">\n    <ref:Standard>IFRS 15</ref:Standard>\n    <ref:Paragraph>10</ref:Paragraph>\n  </link:reference>\n\n  <link:referenceArc xlink:from=\"loc_Revenue\" xlink:to=\"ref_RevenueIFRS15\"\n                       xlink:arcrole=\"[http://www.xbrl.org/2003/arcrole/concept-reference](http://www.xbrl.org/2003/arcrole/concept-reference)\" xlink:type=\"arc\"/>\n\n</link:referenceLink>\n```\n\n**Explanation:**\n\n- The `<link:reference>` resource is defined with `xlink:label=\"ref_RevenueIFRS15\"`, which allows it to be linked.\n- Inside the `<link:reference>`, the `<ref:Standard>` and `<ref:Paragraph>` elements are correctly populated with the provided information.\n- The `xlink:role` and `xlink:type` attributes for the reference resource are standard.\n- The `<link:referenceArc>` properly links `loc_Revenue` (`xlink:from`) to the `ref_RevenueIFRS15` (`xlink:to`) using the `http://www.xbrl.org/2003/arcrole/concept-reference` arcrole, establishing the reference for the `Revenue` concept."
}
]
  },
  {
    id: 6,
    title: "XML Basics: Understanding XBRL",
    summary:
      "Learn Inline XBRL, dimensions, formula linkbases, and automation.",
    image: xbrlImg,
    content: [
  {
    "type": "knowledge",
    "title": "📚 Introduction to XML: What is it?",
    "text": "XML stands for **eXtensible Markup Language**. 📜 It's a markup language, just like HTML, but with a different purpose.\n\n" +
            "While HTML is designed to *display* data (how things look on a webpage), XML is designed to *describe* data. It focuses on what the data *is*.\n\n" +
            "Think of it this way:\n" +
            "- **HTML:** 'This is a **bold** paragraph.' (Focus on presentation)\n" +
            "- **XML:** `<product><name>Laptop</name><price>1200</price></product>` (Focus on data meaning)\n\n" +
            "**Key Characteristics of XML:**\n" +
            "1.  **Extensible:** You can define your *own* tags (elements) to describe your data. There are no predefined tags like in HTML.\n" +
            "2.  **Self-Describing:** The tags themselves often give a clue about the data they contain, making it human-readable.\n" +
            "3.  **Hierarchical:** Data is organized in a tree-like structure with a root element and nested elements.\n" +
            "4.  **Platform Independent:** XML data can be easily exchanged between different applications and systems.\n" +
            "5.  **Strict Rules:** XML is much stricter than HTML about syntax. Every start tag must have an end tag, attributes must be quoted, etc. This makes it easier for machines to parse.\n\n" +
            "**Why is XML important for XBRL?**\n" +
            "XBRL (eXtensible Business Reporting Language) is *built entirely on XML*. All XBRL documents – taxonomies, instance documents, and linkbases – are essentially XML files that follow specific XBRL rules and structures. Understanding XML is the first step to understanding XBRL. 🧱"
  },
  {
    "type": "knowledge",
    "title": "🏷️ XML Elements: The Core Building Blocks",
    "text": "In XML, **elements** are the primary containers for data. They represent distinct pieces of information.\n\n" +
            "An element typically consists of three parts:\n" +
            "1.  **Start Tag:** Marks the beginning of an element (e.g., `<book>`).\n" +
            "2.  **Content:** The data or other elements contained within the element.\n" +
            "3.  **End Tag:** Marks the end of an element (e.g., `</book>`).\n\n" +
            "**Structure of an Element:**\n" +
            "```xml\n" +
            "<elementName>Content goes here</elementName>\n" +
            "```\n\n" +
            "**Example:**\n" +
            "```xml\n" +
            "<product>\n" +
            "  <name>Wireless Headphones</name>\n" +
            "  <price>99.99</price>\n" +
            "  <currency>USD</currency>\n" +
            "</product>\n" +
            "```\n\n" +
            "In this example:\n" +
            "- `<product>` is an element containing other elements.\n" +
            "- `<name>`, `<price>`, and `<currency>` are elements containing text content.\n\n" +
            "**Rules for Element Naming:**\n" +
            "- Names can contain letters, numbers, and other characters.\n" +
            "- Names cannot start with the letters 'xml' (or XML, Xml, etc.).\n" +
            "- Names cannot start with a number or punctuation character.\n" +
            "- Names cannot contain spaces.\n            - XML names are case-sensitive (`<Book>` is different from `<book>`).\n\n" +
            "**Empty Elements:**\n" +
            "An element can exist without any content. These are called **empty elements**.\n" +
            "You can write them in two ways:\n" +
            "1.  With a separate start and end tag: `<break></break>`\n" +
            "2.  Using a self-closing tag: `<break/>` (This is more common and concise for empty elements).\n\n" +
            "**Example of an empty element:**\n" +
            "```xml\n" +
            "<lineBreak/>\n" +
            "<image src=\"logo.png\"/>\n" +
            "```\n\n" +
            "In XBRL, concepts like `<xbrli:context>` or `<xbrli:unit>` are XML elements, often containing other nested elements to describe their full meaning. Facts like `<ex:Assets>` are also elements."
  },
  {
    "type": "knowledge",
    "title": "⚙️ XML Attributes: Describing Elements with Detail",
    "text": "While elements contain the main data, **attributes** provide *additional information* about an element. They are defined directly within the element's start tag.\n\n" +
            "Think of attributes as properties or characteristics of an element that further describe it.\n\n" +
            "**Structure of an Attribute:**\n" +
            "```xml\n" +
            "<elementName attributeName=\"attributeValue\">\n" +
            "  Content\n" +
            "</elementName>\n" +
            "```\n\n" +
            "- **`attributeName`**: The name of the attribute.\n" +
            "- **`attributeValue`**: The value assigned to the attribute. This *must* be enclosed in single (`'`) or double (`\"`) quotes.\n\n" +
            "**Example:**\n" +
            "```xml\n" +
            "<product category=\"electronics\" id=\"P001\">\n" +
            "  <name>Smartphone</name>\n" +
            "  <price>799.00</price>\n" +
            "</product>\n" +
            "```\n\n" +
            "Here, `category` and `id` are attributes of the `<product>` element, providing more context about that specific product.\n\n" +
            "**When to use Elements vs. Attributes?**\n" +
            "This is a common question. Generally:\n" +
            "- **Elements** are best for data that is part of the document's structure or content (e.g., `<name>`, `<price>`).\n" +
            "- **Attributes** are best for data that describes the data in an element or provides metadata (e.g., `id`, `type`, `status`).\n\n" +
            "**XBRL and Attributes:**\n" +
            "Attributes are *extensively* used in XBRL to provide crucial metadata for elements. For example:\n" +
            "- In a Label Linkbase: `xlink:type=\"resource\"`, `xlink:role=\"http://www.xbrl.org/2003/role/label\"`\n" +
            "- In an Instance Document: `contextRef=\"C2023_YE\"`, `unitRef=\"USD\"`, `decimals=\"-3\"`\n\n" +
            "These attributes provide essential context and define how XBRL processors should interpret the elements they belong to. Without them, the XBRL data would be just plain numbers and text, lacking critical meaning. 💡"
  },
  {
    "type": "knowledge",
    "title": "🌲 XML Document Structure: The Root and Hierarchy",
    "text": "Every well-formed XML document must follow a specific structural rule: it must have exactly one **root element**.\n\n" +
            "The **root element** is the top-level element that contains all other elements in the document. It's like the trunk of a tree, from which all other branches (child elements) sprout. 🌳\n\n" +
            "**Example of a simple XML structure:**\n" +
            "```xml\n" +
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<catalog>  \n" +
            "  <book id=\"bk101\">\n" +
            "    <author>J.K. Rowling</author>\n" +
            "    <title>Harry Potter and the Sorcerer's Stone</title>\n" +
            "    <price>19.99</price>\n" +
            "  </book>\n" +
            "  <book id=\"bk102\">\n" +
            "    <author>George Orwell</author>\n" +
            "    <title>1984</title>\n" +
            "    <price>12.50</price>\n" +
            "  </book>\n" +
            "</catalog>\n" +
            "```\n\n" +
            "In this example, `<catalog>` is the root element. It contains two `<book>` elements, which in turn contain `<author>`, `<title>`, and `<price>` elements.\n\n" +
            "**Hierarchy (Parent-Child Relationships):**\n" +
            "XML documents are inherently hierarchical. Elements can be nested inside other elements, creating parent-child relationships:\n" +
            "- An element that contains another element is called the **parent**.\n" +
            "- An element contained within another element is called a **child**.\n            - Elements at the same level, sharing the same parent, are called **siblings**.\n\n" +
            "From the example above:\n" +
            "- `<catalog>` is the parent of the `<book>` elements.\n" +
            "- The `<book>` elements are children of `<catalog>`.\n" +
            "- `<author>`, `<title>`, and `<price>` are children of `<book>`.\n" +
            "- The two `<book>` elements are siblings.\n\n" +
            "**XBRL and Root Elements:**\n" +
            "- **XBRL Instance Document:** The root element is always `<xbrl:xbrl>`.\n" +
            "- **XBRL Taxonomy Schema:** The root element is typically `<xs:schema>`.\n" +
            "- **XBRL Linkbases (Label, Presentation, etc.):** These also have their own specific root elements, like `<link:labelLink>`.\n\n" +
            "This structured, hierarchical nature is what makes XML (and thus XBRL) so powerful for organizing complex data in a consistent and machine-readable way. 🏗️"
  },
  {
    "type": "knowledge",
    "title": "✨ XML Declaration: Starting Your XML Document",
    "text": "The very first line in almost every XML document is the **XML Declaration**. It's optional, but highly recommended, as it provides crucial information about the document itself. ℹ️\n\n" +
            "**Structure:**\n" +
            "```xml\n" +
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
            "```\n\n" +
            "Let's break down its components:\n\n" +
            "1.  **`<?xml ... ?>`**: This is the processing instruction syntax for XML declarations. It always starts with `<?xml` and ends with `?>`.\n\n" +
            "2.  **`version=\"1.0\"`**: This attribute specifies the XML version being used. Currently, `1.0` is the most common and widely supported version.\n\n" +
            "3.  **`encoding=\"UTF-8\"`**: This attribute specifies the character encoding for the XML document. It tells the XML parser how to interpret the bytes of the document into characters.\n" +
            "    - **`UTF-8`**: This is the most common and recommended encoding. It supports virtually all characters from all languages, making it highly versatile.\n" +
            "    - Other common encodings include `ISO-8859-1` (for Western European languages) or `UTF-16`.\n\n" +
            "4.  **`standalone=\"yes|no\"` (Optional):** This attribute indicates whether the XML document is standalone, meaning it doesn't rely on an external Document Type Definition (DTD) for its validity.\n" +
            "    - `yes`: The document is standalone (does not require external DTDs).\n" +
            "    - `no`: The document is not standalone (requires external DTDs).\n            - If omitted, the default is `no` if there's an external DTD, and `yes` otherwise.\n\n" +
            "**Example in an XBRL Context:**\n" +
            "You will see this at the very top of every XBRL schema, instance document, and linkbase file:\n" +
            "```xml\n" +
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<xbrl xmlns=\"[http://www.xbrl.org/2003/instance](http://www.xbrl.org/2003/instance)\" ...>\n" +
            "  \n" +
            "</xbrl>\n" +
            "```\n\n" +
            "The XML declaration ensures that XML parsers (the software that reads and understands XML) correctly interpret the document's characters and version, preventing errors and ensuring proper processing. It's the essential kickoff to any XML file. 🚀"
  },
  {
    "type": "knowledge",
    "title": "🌐 XML Namespaces: Avoiding Name Collisions (The 'What' and 'Why')",
    "text": "Imagine you're building a report that includes financial data and product data. Both might have an element named `<date>`. How does an XML parser know if `<date>` means 'reporting date' or 'manufacture date'? This is where **XML Namespaces** come in. 🚧\n\n" +
            "**What are XML Namespaces?**\n" +
            "Namespaces provide a way to avoid element and attribute name conflicts by providing a mechanism to uniquely qualify element and attribute names. They effectively create 'families' or 'vocabularies' of XML elements.\n\n" +
            "**Why do we need Namespaces?**\n" +
            "In complex XML documents (like XBRL, which combines multiple standards):\n" +
            "1.  **Ambiguity:** Prevents confusion when different XML vocabularies (sets of elements) use the same element name for different purposes.\n" +
            "2.  **Modularity:** Allows for mixing and matching elements from different schemas without name clashes.\n\n 3.  **Uniqueness:** Ensures that an element name is unique within its context.\n\n" +
            "**How Namespaces Work:**\n" +
            "Namespaces are identified by a **URI (Uniform Resource Identifier)**. This URI is typically a URL (e.g., `http://www.xbrl.org/2003/instance`), but it doesn't have to point to an actual webpage. Its primary purpose is to serve as a unique identifier for the namespace.\n\n" +
            "To use a namespace, you declare it using the `xmlns` attribute (XML Namespace) within an element's tag. This declaration applies to the element it's declared on and all its descendants.\n\n" +
            "**Example Scenario (without namespaces):**\n" +
            "```xml\n" +
            "<report>\n" +
            "  <date>2023-12-31</date> \n" +
            "  <item>\n" +
            "    <date>2023-11-15</date> \n" +
            "  </item>\n" +
            "</report>\n" +
            "```\n" +
            "Here, `date` is ambiguous.\n\n" +
            "**Example Scenario (with namespaces):**\n" +
            "```xml\n" +
            "<report \n" +
            "  xmlns:fin=\"[http://example.com/financial](http://example.com/financial)\"\n" +
            "  xmlns:prod=\"[http://example.com/product](http://example.com/product)\">\n" +
            "  \n" +
            "  <fin:date>2023-12-31</fin:date>\n" +
            "  <prod:item>\n" +
            "    <prod:date>2023-11-15</prod:date>\n" +
            "  </prod:item>\n" +
            "</report>\n" +
            "```\n\n" +
            "Now, `fin:date` clearly refers to a financial date, and `prod:date` refers to a product date. The ambiguity is resolved! ✅\n\n" +
            "In XBRL, you'll see namespaces like `xbrli`, `link`, and custom prefixes for taxonomy-specific concepts. This is how XBRL manages its complex structure and integrates definitions from various sources."
  },
  {
    "type": "knowledge",
    "title": "🏷️ XML Prefixes and the Colon (`:`) in Namespaces",
    "text": "When you see a colon (`:`) in an XML tag or attribute, like `xbrli:context` or `link:labelArc`, it signifies the use of an **XML Namespace Prefix**.\n\n" +
            "**What is a Prefix?**\n" +
            "A prefix is a short, readable alias (nickname) that you associate with a longer, unique namespace URI. Instead of writing the full URI every time you use an element from that namespace, you use the shorter prefix.\n\n" +
            "**How are Prefixes Declared?**\n" +
            "Prefixes are declared using the `xmlns:` attribute, followed by the chosen prefix, and then the equal sign and the namespace URI in quotes.\n\n" +
            "**Structure:** `xmlns:yourPrefix=\"http://the/unique/namespace/uri\"`\n\n" +
            "**Example:**\n" +
            "```xml\n" +
            "<xbrl \n" +
            "  xmlns:xbrli=\"[http://www.xbrl.org/2003/instance](http://www.xbrl.org/2003/instance)\" \n" +
            "  xmlns:link=\"[http://www.xbrl.org/2003/linkbase](http://www.xbrl.org/2003/linkbase)\" \n" +
            "  xmlns:ex=\"[http://www.example.com/mycompany/taxonomy](http://www.example.com/mycompany/taxonomy)\">\n" +
            "  \n" +
            "  <xbrli:context id=\"c1\">...</xbrli:context>\n" +
            "  <link:labelLink>...</link:labelLink>\n" +
            "  <ex:Assets>...</ex:Assets>\n" +
            "  \n" +
            "</xbrl>\n" +
            "```\n\n" +
            "In this example:\n" +
            "- `xmlns:xbrli=\"http://www.xbrl.org/2003/instance\"` declares that `xbrli` is the prefix for the XBRL instance namespace.\n" +
            "- `xmlns:link=\"http://www.xbrl.org/2003/linkbase\"` declares `link` for the XBRL linkbase namespace.\n            - `xmlns:ex=\"http://www.example.com/mycompany/taxonomy\"` declares `ex` for a custom taxonomy namespace.\n\n" +
            "**The Role of the Colon (`:`):**\n" +
            "The colon separates the **prefix** from the **local name** of the element or attribute.\n\n" +
            "**Example:** `xbrli:context`\n" +
            "- `xbrli`: This is the prefix, referring to the `http://www.xbrl.org/2003/instance` namespace.\n" +
            "- `context`: This is the local name of the element.\n" +
            "- Together, `xbrli:context` uniquely identifies the 'context' element *within the XBRL instance namespace*.\n\n" +
            "**Default Namespace (`xmlns` without a prefix):**\n" +
            "You can also declare a **default namespace** for an element and its children. This means elements within that scope that *don't* have a prefix belong to that default namespace.\n\n" +
            "**Example:**\n" +
            "```xml\n" +
            "<bookstore xmlns=\"[http://www.books.com/namespace](http://www.books.com/namespace)\">\n" +
            "  <book>\n" +
            "    <title>The XML Guide</title>\n" +
            "  </book>\n" +
            "</bookstore>\n" +
            "```\n" +
            "Here, `bookstore`, `book`, and `title` all belong to the `http://www.books.com/namespace` because it's the default.\n\n" +
            "In XBRL, `xbrli` is often declared as the default namespace on the root `<xbrl>` element, so you might sometimes see `<context>` instead of `<xbrli:context>`, depending on how the document is structured. However, using prefixes explicitly is generally clearer, especially when mixing multiple namespaces. 🎯"
  },
  {
    "type": "knowledge",
    "title": "📝 XML Schema (XSD): Defining XML Document Rules",
    "text": "While XML provides a flexible way to structure data, it doesn't enforce *what* data should be there or *how* it should be structured beyond basic well-formedness rules. This is where **XML Schema Definition (XSD)** comes in. 📐\n\n" +
            "An **XML Schema** is an XML-based language used to define the structure, content, and data types of XML documents. It's like a blueprint or a contract that specifies what elements and attributes are allowed, their order, their data types, and their relationships.\n\n" +
            "**Why is XSD important?**\n" +
            "1.  **Validation:** An XSD can be used to validate an XML document, ensuring it conforms to the defined rules. If a document doesn't follow the schema, it's considered 'invalid.'\n" +
            "2.  **Data Consistency:** Enforces consistent data structures across different XML files.\n" +
            "3.  **Data Types:** Allows for defining specific data types (e.g., integer, date, string, monetary) for elements and attributes, enabling better data processing and validation.\n            4.  **Tool Support:** Many development tools and parsers can use XSDs to provide auto-completion, validation, and data binding.\n\n" +
            "**Key Elements in an XSD:**\n" +
            "- **`<xs:schema>`:** The root element of every XML Schema document.\n" +
            "- **`<xs:element>`:** Defines an XML element. You specify its name, type, and other properties.\n" +
            "- **`<xs:attribute>`:** Defines an XML attribute.\n" +
            "- **`<xs:complexType>`:** Defines elements that can contain other elements and/or attributes.\n" +
            "- **`<xs:simpleType>`:** Defines elements or attributes that can only contain text content, but with specific constraints (e.g., a specific pattern, enumeration of allowed values).\n\n - **`targetNamespace`**: Specifies the namespace that elements and attributes declared in *this* schema belong to.\n\n - **`xmlns:xs`**: Declares the prefix for the XML Schema namespace (`http://www.w3.org/2001/XMLSchema`).\n\n" +
            "**Example (Simplified XSD Snippet):**\n" +
            "```xml\n" +
            "<xs:schema \n" +
            "  xmlns:xs=\"[http://www.w3.org/2001/XMLSchema](http://www.w3.org/2001/XMLSchema)\"\n" +
            "  targetNamespace=\"[http://www.example.com/products](http://www.example.com/products)\"\n" +
            "  elementFormDefault=\"qualified\">\n\n" +
            "  <xs:element name=\"product\">\n" +
            "    <xs:complexType>\n" +
            "      <xs:sequence>\n" +
            "        <xs:element name=\"name\" type=\"xs:string\"/>\n" +
            "        <xs:element name=\"price\" type=\"xs:decimal\"/>\n" +
            "        <xs:element name=\"availability\" type=\"xs:boolean\" minOccurs=\"0\"/>\n" +
            "      </xs:sequence>\n" +
            "      <xs:attribute name=\"id\" type=\"xs:ID\" use=\"required\"/>\n" +
            "    </xs:complexType>\n" +
            "  </xs:element>\n" +
            "\n" +
            "</xs:schema>\n" +
            "```\n\n" +
            "This schema defines that a `<product>` element must have a `name` (string), a `price` (decimal), an optional `availability` (boolean), and a required `id` attribute.\n\n" +
            "**XSD in XBRL:**\n" +
            "XBRL Taxonomies are fundamentally defined using XML Schema (`.xsd`) files. These schema files define all the financial and business concepts (like 'Assets', 'Revenue', 'NetIncomeLoss') that can be reported. The data types (monetary, date, text) for these concepts are also defined within the schema. This ensures that XBRL reports use consistent definitions and types, making them reliable and comparable. It's the backbone of XBRL's structure. 🏗️"
  },
  
  {
    "type": "knowledge",
    "title": "🔗 `xsi:schemaLocation`: Connecting XML to its Schema",
    "text": "When you have an XML document and an XML Schema (XSD) that defines its structure, how do you tell the XML parser which schema to use for validation? This is done using the `xsi:schemaLocation` attribute. 🤝\n\n" +
            "**What is `xsi:schemaLocation`?**\n\n" +
            "The `xsi:schemaLocation` attribute is part of the XML Schema instance namespace (`http://www.w3.org/2001/XMLSchema-instance`). It provides a hint to an XML parser about where to find the XML Schema file that defines the elements and attributes used in the XML document.\n\n" +
            "**Structure:**\n" +
            "```xml\n" +
            "<rootElement \n" +
            "  xmlns:xsi=\"[http://www.w3.org/2001/XMLSchema-instance](http://www.w3.org/2001/XMLSchema-instance)\"\n" +
            "  xsi:schemaLocation=\"namespaceURI locationOfSchemaFile\">\n" +
            "  \n" +
            "</rootElement>\n" +
            "```\n\n" +
            "It takes a list of pairs of values:\n" +
            "- **`namespaceURI`**: The target namespace of the schema you want to associate.\n" +
            "- **`locationOfSchemaFile`**: The hint (URL or relative path) to the actual `.xsd` file where that namespace is defined.\n\n" +
            "**Example:**\n" +
            "Let's say you have an XML document that uses elements from the `http://www.example.com/products` namespace, and its schema is located at `products.xsd` in the same directory.\n\n" +
            "```xml\n" +
            "<catalog \n" +
            "  xmlns=\"[http://www.example.com/products](http://www.example.com/products)\" \n" +
            "  xmlns:xsi=\"[http://www.w3.org/2001/XMLSchema-instance](http://www.w3.org/2001/XMLSchema-instance)\"\n" +
            "  xsi:schemaLocation=\"[http://www.example.com/products](http://www.example.com/products) products.xsd\">\n" +
            "  \n" +
            "  <product id=\"P001\">\n" +
            "    <name>Laptop</name>\n" +
            "    <price>1200.00</price>\n" +
            "  </product>\n" +
            "\n" +
            "</catalog>\n" +
            "```\n\n" +
            "In this example:\n" +
            "- `xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"` declares the `xsi` prefix for the XML Schema instance namespace.\n" +
            "- `xsi:schemaLocation=\"http://www.example.com/products products.xsd\"` tells the parser: 'For elements that belong to the `http://www.example.com/products` namespace, you can find their definitions in the `products.xsd` file.'\n\n" +
            "**XBRL and `xsi:schemaLocation`:**\n" +
            "This attribute is crucial in XBRL Instance Documents. It's used to link the instance document to the specific taxonomy schema(s) that define the concepts used in the report.\n\n" +
            "```xml\n" +
            "<xbrl \n" +
            "  xmlns:ex=\"[http://www.example.com/mycompany/taxonomy](http://www.example.com/mycompany/taxonomy)\"\n" +
            "  xmlns:xsi=\"[http://www.w3.org/2001/XMLSchema-instance](http://www.w3.org/2001/XMLSchema-instance)\" \n" +
            "  xsi:schemaLocation=\"[http://www.example.com/mycompany/taxonomy](http://www.example.com/mycompany/taxonomy) ../taxonomy.xsd\">\n" +
            "  \n" +
            "  \n" +
            "  <ex:Assets contextRef=\"C1\" unitRef=\"U1\">1000000</ex:Assets>\n" +
            "\n" +
            "</xbrl>\n" +
            "```\n\n" +
            "Here, the XBRL instance document declares that concepts from the `http://www.example.com/mycompany/taxonomy` namespace are defined in the `../taxonomy.xsd` file. This allows XBRL processors to load the correct taxonomy and validate the instance document against it. Without this link, the XBRL document wouldn't know what its reported values actually mean in a business context. 🤝"
  },
  {
    "type": "knowledge",
    "title": "📚 XBRL Core Concepts: Putting XML to Work",
    "text": "Now that we have a solid understanding of XML fundamentals, let's see how XBRL uses them to define and exchange business information. XBRL stands for **eXtensible Business Reporting Language**.\n\n" +
            "At its heart, XBRL takes the flexibility of XML and applies it specifically to financial and business data, adding a layer of semantic meaning and validation. 📊\n\n" +
            "**The Big Picture of XBRL:**\n" +
            "XBRL works by creating a standardized, machine-readable format for business reports. It achieves this through two main types of documents:\n\n" +
            "### 1. XBRL Taxonomies (The Dictionary/Blueprint)\n" +
            "A **Taxonomy** is a set of XML Schema (`.xsd`) and Linkbase (`.xml`) files that define the reporting concepts and their relationships for a specific reporting domain (e.g., IFRS, US GAAP, or a company's internal reporting standards).\n\n" +
            "-   **XML Schema (`.xsd`):** Defines the actual concepts (like 'Assets', 'Revenue') and their data types (monetary, date, text).\n" +
            "-   **Linkbases (`.xml`):** Define the relationships *between* these concepts, providing business meaning:\n    -   **Label Linkbase:** Connects technical concepts to human-readable names.\n    -   **Presentation Linkbase:** Defines how concepts are grouped and displayed hierarchically.\n    -   **Calculation Linkbase:** Specifies mathematical relationships (e.g., Assets = Liabilities + Equity).\n    -   **Definition Linkbase:** Defines other semantic relationships.\n    -   **Reference Linkbase:** Links concepts to authoritative accounting literature.\n\n" +
            "Taxonomies are built using XML Schema rules for definition and XML Linkbase rules for relationships. They are the 'vocabulary' that XBRL reports speak.\n\n" +
            "### 2. XBRL Instance Documents (The Actual Report Data)\n" +
            "An **Instance Document** is an XML file that contains the actual facts (data values) reported by an entity for a specific period, using the concepts defined in a particular taxonomy.\n\n" +
            "It's like filling out a form based on the rules and definitions provided in the taxonomy.\n\n" +
            "**Key XML Elements and Attributes in XBRL Instance Documents:**\n" +
            "-   **`<xbrl:xbrl>`:** The root element of the instance document.\n" +
            "-   **`<xbrli:context>`:** Defines the context for each fact (entity, period, dimensions).\n" +
            "-   **`<xbrli:unit>`:** Defines the unit of measure for numeric facts (e.g., USD, shares).\n" +
            "-   **Fact Elements (e.g., `<ex:Assets>`):** These are the actual reported values, which are XML elements that map to concepts defined in the taxonomy. They include attributes like `contextRef` and `unitRef`.\n\n" +
            "**How it all fits together:**\n" +
            "1.  A **Taxonomy** is created (XML Schema for concepts, XML Linkbases for relationships).\n" +
            "2.  An **Instance Document** is created, referencing the taxonomy using `xsi:schemaLocation`.\n" +
            "3.  Data (facts) are entered into the instance document, tagged with concepts from the taxonomy and associated with `context` and `unit` elements.\n\n  4.  XBRL software can then read the instance document, understand the data's meaning by looking up the taxonomy, and perform validation, analysis, and rendering.\n\n" +
            "This XML-based structure is what makes XBRL reports highly standardized, comparable, and automation-friendly, transforming static reports into dynamic data sets. 🚀"
  },
  {
    "type": "knowledge",
    "title": "🏢 `xbrli:entity`: Who is Reporting?",
    "text": "In an XBRL Instance Document, every reported fact must be associated with a **context**, and a key part of that context is the **entity** that is reporting the data.\n\n" +
            "The `xbrli:entity` element (part of the XBRL Instance namespace) is used to uniquely identify the reporting organization or person.\n\n" +
            "**Structure:**\n" +
            "```xml\n" +
            "<xbrli:context id=\"C1\">\n" +
            "  <xbrli:entity>\n" +
            "    <xbrli:identifier scheme=\"[http://www.sec.gov/cik](http://www.sec.gov/cik)\">0001045810</xbrli:identifier>\n" +
            "    \n" +
            "  </xbrli:entity>\n" +
            "  \n" +
            "</xbrli:context>\n" +
            "```\n\n" +
            "**Key Element within `xbrli:entity`:**\n" +
            "-   **`<xbrli:identifier>`:** This is the most crucial part. It provides a unique code or name for the reporting entity.\n    -   **`scheme` attribute:** This is a URI that identifies the *scheme* or standard by which the identifier is assigned. This is vital because different systems use different identifiers for entities.\n        -   **Examples of `scheme` URIs:**\n            -   `http://www.sec.gov/cik`: For Central Index Key (CIK) codes used by the U.S. SEC.\n            -   `http://standards.iso.org/iso/17442/2012`: For Legal Entity Identifiers (LEIs).\n            -   `http://www.companieshouse.gov.uk/id/company`: For UK Companies House registration numbers.\n            -   Custom URIs for internal company identifiers.\n    -   **Content:** The actual identifier value (e.g., `0001045810`, `549300LS467R7P64C729`).\n\n" +
            "**Why is `xbrli:entity` important?**\n" +
            "1.  **Identification:** Clearly identifies *who* is providing the financial data.\n" +
            "2.  **Comparability:** Enables automated systems to pull data for specific entities, making cross-company comparisons possible.\n\n" 
            + 
            "3.  **Uniqueness:** Combined with the period and other context details, it helps ensure that each reported fact is uniquely identified.\n\n" +
            "**Example in a full context:**\n" +
            "```xml\n" +
            "<xbrli:context id=\"C_ABC_2023_YE\">\n" +
            "  <xbrli:entity>\n" +
            "    <xbrli:identifier scheme=\"[http://www.sec.gov/cik](http://www.sec.gov/cik)\">0001234567</xbrli:identifier>\n" +
            "  </xbrli:entity>\n" +
            "  <xbrli:period>\n" +
            "    <xbrli:endDate>2023-12-31</xbrli:endDate>\n" +
            "  </xbrli:period>\n" +
            "</xbrli:context>\n" +
            "\n" +
            "<ex:Assets contextRef=\"C_ABC_2023_YE\" unitRef=\"USD\" decimals=\"-3\">15000000</ex:Assets>\n" +
            "```\n\n" +
            "Here, the `Assets` fact is clearly reported by the entity with CIK `0001234567` for the period ending `2023-12-31`. This precision is what makes XBRL data so powerful for analysis and regulatory reporting. 🆔"
  },
  {
    "type": "knowledge",
    "title": "⏱️ `xbrli:period`: When was the Data Valid?",
    "text": "Time is a critical dimension in financial reporting. The `xbrli:period` element (part of the XBRL Instance namespace) within an `<xbrli:context>` specifies the time interval or point in time to which a reported fact applies. ⏰\n\n" +
            "XBRL distinguishes between two main types of periods:\n\n" +
            "### 1. Instant Period (`<xbrli:instant>`) - For Point-in-Time Data\n" +
            "An **instant period** is used for facts that represent a value at a specific point in time. These are typically balance sheet items.\n\n" +
            "**Structure:**\n" +
            "```xml\n" +
            "<xbrli:period>\n" +
            "  <xbrli:instant>YYYY-MM-DD</xbrli:instant>\n" +
            "</xbrli:period>\n" +
            "```\n\n" +
            "-   **`YYYY-MM-DD`**: The date in ISO 8601 format.\n\n" +
            "**Use Case:**\n" +
            "-   Cash balance as of December 31, 2023.\n" +
            "-   Total Assets at the end of the fiscal year.\n            -   Number of employees on a specific date.\n\n" +
            "**Example:**\n" +
            "```xml\n" +
            "<xbrli:context id=\"C_2023_Dec31\">\n" +
            "  <xbrli:entity>...</xbrli:entity>\n" +
            "  <xbrli:period>\n" +
            "    <xbrli:instant>2023-12-31</xbrli:instant>\n" +
            "  </xbrli:period>\n" +
            "</xbrli:context>\n" +
            "\n" +
            "<ex:CashAndCashEquivalents contextRef=\"C_2023_Dec31\" unitRef=\"USD\" decimals=\"-3\">1200000</ex:CashAndCashEquivalents>\n" +
            "```\n\n" +
            "### 2. Duration Period (`<xbrli:startDate>` and `<xbrli:endDate>`) - For Period-of-Time Data\n" +
            "A **duration period** is used for facts that represent a value over a specific period. These are typically income statement, cash flow, or comprehensive income items.\n\n" +
            "**Structure:**\n" +
            "```xml\n" +
            "<xbrli:period>\n" +
            "  <xbrli:startDate>YYYY-MM-DD</xbrli:startDate>\n" +
            "  <xbrli:endDate>YYYY-MM-DD</xbrli:endDate>\n" +
            "</xbrli:period>\n" +
            "```\n\n" +
            "**Use Case:**\n" +
            "-   Revenue for the fiscal year ended December 31, 2023.\n" +
            "-   Net Income for the quarter.\n            -   Cash flow from operating activities over a period.\n\n" +
            "**Example:**\n" +
            "```xml\n" +
            "<xbrli:context id=\"C_2023_FY\">\n" +
            "  <xbrli:entity>...</xbrli:entity>\n" +
            "  <xbrli:period>\n" +
            "    <xbrli:startDate>2023-01-01</xbrli:startDate>\n" +
            "    <xbrli:endDate>2023-12-31</xbrli:endDate>\n" +
            "  </xbrli:period>\n" +
            "</xbrli:context>\n" +
            "\n" +
            "<ex:Revenue contextRef=\"C_2023_FY\" unitRef=\"USD\" decimals=\"-3\">10000000</ex:Revenue>\n" +
            "```\n\n" +
            "**Why is `xbrli:period` important?**\n" +
            "1.  **Temporal Context:** Provides the crucial 'when' for each reported fact, distinguishing between point-in-time and period-based data.\n" +
            "2.  **Comparability:** Enables financial analysts and systems to accurately compare data across different reporting periods.\n\n   3.  **Data Integrity:** Ensures that data is interpreted correctly within its temporal scope.\n\n" +
            "By clearly defining the period, XBRL ensures that data like 'Cash' and 'Revenue' (which are fundamentally different in their time dimension) are correctly understood and processed. 🗓️"
  }
]
  }
];
