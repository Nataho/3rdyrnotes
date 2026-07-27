---
cssclasses:
  - wide
---
```dataviewjs
// 1. Convert to a true JavaScript array and strictly filter for valid dates
let pages = Array.from(dv.pages('""'))
    .filter(p => p.due_date && p.due_date.toISODate && typeof p.due_date.toISODate === 'function');

// 2. Sort safely using a standard JavaScript array sort operation
pages.sort((a, b) => {
    let t = dv.date('today').toISODate();
    let da = a.due_date.toISODate();
    let db = b.due_date.toISODate();

    // Assign numeric priority ranks to the categories
    let getRank = (page, dateStr) => {
        if (dateStr === t) return 1;          // Today gets top priority
        if (page.due_date > dv.date('today')) return 2; // Later gets second priority
        return 3;                             // Overdue gets last priority
    };

    let rankA = getRank(a, da);
    let rankB = getRank(b, db);

    // If they are in different status categories, sort by category rank
    if (rankA !== rankB) return rankA - rankB;

    // If they are in the same category, sort them chronologically by due date
    return a.due_date - b.due_date;
});

// 3. Build the table data array
let rows = [];
for (let p of pages) {
    let status = "📅 Later";
    let d = p.due_date.toISODate();
    let t = dv.date('today').toISODate();
    
    if (p.progress === "finished") status = "🟢 Finished";
    else if (p.due_date < dv.date('today')) status = "🚨 Overdue";
    else if (d === t) status = "☀️ Today";

    let type = "❓ Other";
    if (p.file.tags && p.file.tags.includes("#task")) type = "💼 Project";
    else if (p.file.tags && p.file.tags.includes("#homework")) type = "📝 Assignment";

    rows.push([
        p.file.link,
        p.due_date.toISODate(),
        status,
        type,
        p.progress || "➖"
    ]);
}

// 4. Render the table
dv.table(["Name", "Due Date", "Status", "Type", "Progress"], rows);

// 5. Apply full-row background colors based on rules
setTimeout(() => {
    let tableRows = dv.container.querySelectorAll(".table-view-table tbody tr");
    tableRows.forEach(row => {
        if (!row.cells || row.cells.length < 5) return;
        
        let statusCell = row.cells[2]?.innerText || "";
        let progressCell = row.cells[4]?.innerText || "";
        
        if (progressCell === "finished" || statusCell.includes("Finished")) {
            row.style.backgroundColor = "rgba(46, 204, 113, 0.15)"; // Soft Green row
        } else if (statusCell.includes("Overdue")) {
            row.style.backgroundColor = "rgba(231, 76, 60, 0.15)";  // Soft Red row
        } else if (progressCell === "in progress") {
            row.style.backgroundColor = "rgba(52, 152, 219, 0.15)"; // Soft Blue row
        } else if (progressCell === "untouched") {
            row.style.backgroundColor = "rgba(241, 196, 15, 0.15)"; // Soft Yellow row
        }
    });
}, 100);
```

