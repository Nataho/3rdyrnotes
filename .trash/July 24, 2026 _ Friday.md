# Tasks and Homework

```dataview
TABLE 
    due_date AS "Due Date",
    choice(due_date < date(today), "🚨 Overdue", 
    choice(due_date = date(today), "☀️ Today", "📅 Later")) AS "Status",
    choice(contains(file.tags, "#task"), "💼 Project", 
    choice(contains(file.tags, "#homework"), "📝 Assignment", "❓ Other")) AS "Type"
FROM ""
WHERE due_date
SORT choice(due_date = date(today), 1, choice(due_date > date(today), 2, 3)) ASC, due_date ASC
```

