body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
    color: #333;
}

header {
    background-color: #4CAF50;
    color: white;
    padding: 1rem 0;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex; /* Use flexbox for layout */
    flex-direction: column; /* Stack items vertically */
    align-items: center; /* Center items horizontally */
    position: relative; /* For dropdown positioning */
    min-height: 80px; /* Ensure enough space for content */
}

header h1 {
    margin: 0;
    padding-bottom: 10px; /* Space between title and nav */
    font-size: 2em;
}

/* NEW: Main navigation styling */
.main-nav {
    width: 100%;
    max-width: 1200px; /* Align with main content width */
    display: flex;
    justify-content: flex-end; /* Push menu to the right */
    padding-right: 20px; /* Padding from right edge */
    box-sizing: border-box; /* Include padding in width */
    margin-top: -30px; /* Adjust if needed to fit with h1 */
    position: absolute; /* Position absolutely within header */
    top: 20px; /* Align with top of header */
    right: 0;
}

/* NEW: Dropdown button */
.dropbtn {
    background-color: #007bff; /* Button blue */
    color: white;
    padding: 10px 15px;
    font-size: 1em;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

.dropbtn:hover, .dropbtn:focus {
    background-color: #0056b3;
}

/* NEW: Dropdown container */
.dropdown {
    position: relative;
    display: inline-block; /* Allow other items to be next to it if needed */
}

/* NEW: Dropdown content (hidden by default) */
.dropdown-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 180px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1; /* Ensure it appears above other content */
    border-radius: 5px;
    right: 0; /* Align dropdown to the right of the button */
    top: 45px; /* Position below the button */
}

/* NEW: Links inside the dropdown */
.dropdown-content a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
    text-align: left;
}

/* NEW: Change color of dropdown links on hover */
.dropdown-content a:hover {
    background-color: #f1f1f1;
    border-radius: 5px;
}

/* NEW: Show the dropdown menu on hover or when button is clicked */
.dropdown.show .dropdown-content {
    display: block !important; /* <--- This is the !important fix */
}


main {
    padding: 20px;
    max-width: 1200px;
    margin: 20px auto;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.controls-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.dropdown-group {
    display: flex;
    flex-direction: column;
    min-width: 200px;
}

.dropdown-group label {
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
}

.dropdown-group select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1em;
    background-color: white;
    cursor: pointer;
}

.view-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
}

.btn {
    background-color: #007bff;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
}

.btn:hover {
    background-color: #0056b3;
}

.report-display {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.report-display h3, .report-display h4 {
    color: #4CAF50;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}

.data-table, .performance-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.data-table th, .data-table td,
.performance-table th, .performance-table td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
}

.data-table th, .performance-table th {
    background-color: #f2f2f2;
    font-weight: bold;
}

.data-table tr:nth-child(even), .performance-table tr:nth-child(even) {
    background-color: #f9f9f9;
}

.data-table tr:hover, .performance-table tr:hover {
    background-color: #f1f1f1;
}

.summary-list {
    list-style: none;
    padding: 0;
}

.summary-list li {
    padding: 5px 0;
    border-bottom: 1px dotted #eee;
}

.summary-list li:last-child {
    border-bottom: none;
}

/* Performance Report Specific Styles */
.performance-metric {
    font-weight: bold;
}

.progress-bar-container {
    width: 100%;
    background-color: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
    height: 20px;
    margin: 5px 0;
}

.progress-bar {
    height: 100%;
    border-radius: 5px;
    text-align: center;
    color: white;
    font-weight: bold;
    font-size: 0.8em;
    line-height: 20px;
    transition: width 0.5s ease-in-out, background-color 0.3s ease;
}

.progress-bar.danger {
    background-color: #dc3545; /* Red */
}

.progress-bar.warning {
    background-color: #ffc107; /* Yellow */
}

.progress-bar.success {
    background-color: #28a745; /* Green */
}

.progress-bar.overachieved {
    background-color: #6f42c1; /* Purple/Darker color for over 100% */
}


/* New Layouts for Side-by-Side Display */

/* For Branch-level reports (Activity Summary & Performance Report) */
.branch-summary-grid,
.branch-performance-grid {
    display: flex;
    flex-wrap: wrap; /* Allow cards to wrap to the next line */
    gap: 20px; /* Space between cards */
    justify-content: flex-start; /* Align cards to the start */
    align-items: stretch; /* Stretch items to fill height, useful if cards have different heights */
}

.employee-summary-card,
.employee-performance-card {
    flex: 1; /* Allow cards to grow and shrink */
    min-width: 300px; /* Minimum width before wrapping */
    max-width: calc(50% - 10px); /* Allow two columns with gap */
    box-sizing: border-box; /* Include padding and border in the width */
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
    margin-bottom: 10px; /* Space between rows when wrapped */
    box-shadow: 0 2px 5px rgba(0,0,0,0.05); /* Subtle shadow */
}

/* Adjust max-width for smaller screens if needed (e.g., one column) */
@media (max-width: 768px) {
    .employee-summary-card,
    .employee-performance-card {
        max-width: 100%; /* Full width on smaller screens */
    }
}


/* Specific styling for tables within employee performance cards */
.employee-performance-card .performance-table {
    width: 100%;
    margin-top: 10px;
    font-size: 0.85em; /* Make text a bit smaller to fit */
    table-layout: fixed; /* Ensures even column distribution */
}

.employee-performance-card .performance-table th,
.employee-performance-card .performance-table td {
    padding: 5px;
    vertical-align: middle;
    word-break: break-word; /* Prevent long words from breaking layout */
}

/* Adjust progress bar container for smaller space in branch performance cards */
.progress-bar-container-small {
    width: 100%; /* Take full width of the cell */
    background-color: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
    height: 15px; /* Smaller height for compactness */
    margin: 0; /* Remove extra margin */
}

.progress-bar-container-small .progress-bar {
    height: 100%;
    border-radius: 5px;
    text-align: center;
    color: white;
    font-size: 0.7em; /* Smaller font for percentage */
    line-height: 15px; /* Vertically align text */
    transition: width 0.5s ease-in-out;
}


/* For Employee Summary (Breakdowns side-by-side) */
.summary-details-container {
    display: flex;
    flex-wrap: wrap; /* Allow breakdown sections to wrap */
    gap: 20px; /* Space between breakdown sections */
    justify-content: flex-start;
    margin-top: 20px;
}

.summary-details-container > div {
    flex: 1; /* Allow each breakdown div to grow/shrink */
    min-width: 280px; /* Minimum width for each breakdown list */
    max-width: calc(50% - 10px); /* Allow two columns with gap */
    box-sizing: border-box;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #fafafa;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.02); /* Subtle inner shadow */
}
@media (max-width: 600px) {
    .summary-details-container > div {
        max-width: 100%; /* One column on very small screens */
    }
}


.summary-details-container h4 {
    margin-top: 0;
    font-size: 1.1em;
    border-bottom: 1px dashed #ccc;
    padding-bottom: 5px;
    color: #333; /* Darker color for headings */
}

.summary-details-container ul.summary-list {
    list-style: none; /* Remove default bullet points */
    padding: 0;
    margin: 0;
}

.summary-details-container ul.summary-list li {
    padding: 3px 0;
    font-size: 0.95em;
    line-height: 1.4;
}

/* Ensure consistent button display */
.btn {
    display: inline-block; /* Ensure buttons align horizontally */
    margin-right: 10px; /* Space between buttons */
    margin-bottom: 10px; /* Space when wrapped */
    /* Other existing button styles */
}

/* Added for clarity on report output */
p {
    line-height: 1.5;
    margin-bottom: 10px;
}
