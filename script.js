document.addEventListener('DOMContentLoaded', () => {
    // *** Configuration ***
    const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTO7LujC4VSa2wGkJ2YEYSN7UeXR221ny3THaVegYfNfRm2JQGg7QR9Bxxh9SadXtK8Pi6-psl2tGsb/pub?gid=696550092&single=true&output=csv";

    const MONTHLY_WORKING_DAYS = 22; // Common approximation for a month's working days

    const TARGETS = {
        'Branch Manager': {
            'Visit': 10,
            'Call': 3 * MONTHLY_WORKING_DAYS,
            'Reference': 1 * MONTHLY_WORKING_DAYS,
            'New Customer Leads': 20
        },
        'Default': { // For all other designations not explicitly defined
            'Visit': 5,
            'Call': 3 * MONTHLY_WORKING_DAYS,
            'Reference': 1 * MONTHLY_WORKING_DAYS,
            'New Customer Leads': 20
        }
    };

    // *** DOM Elements ***
    const branchSelect = document.getElementById('branchSelect');
    const employeeFilterPanel = document.getElementById('employeeFilterPanel');
    const employeeSelect = document.getElementById('employeeSelect');
    const viewOptions = document.getElementById('viewOptions');
    const viewBranchSummaryBtn = document.getElementById('viewBranchSummaryBtn');
    const viewBranchPerformanceReportBtn = document.getElementById('viewBranchPerformanceReportBtn');
    const viewAllEntriesBtn = document.getElementById('viewAllEntriesBtn');
    const viewEmployeeSummaryBtn = document.getElementById('viewEmployeeSummaryBtn');
    const viewPerformanceReportBtn = document.getElementById('viewPerformanceReportBtn');
    const reportDisplay = document.getElementById('reportDisplay');

    // NEW: Report Menu Elements
    const reportsMenuBtn = document.getElementById('reportsMenuBtn');
    const reportsDropdown = document.getElementById('reportsDropdown');
    const allBranchSnapshotBtn = document.getElementById('allBranchSnapshotBtn');
    const allStaffOverallPerformanceBtn = document.getElementById('allStaffOverallPerformanceBtn'); // <--- ADDED FOR NEW REPORT


    // *** Data Storage ***
    let allCanvassingData = []; // Stores all fetched data
    let filteredBranchData = []; // Stores data for the currently selected branch
    let selectedEmployeeEntries = []; // Stores entries for the currently selected employee

    // *** Utility Functions ***

    // Simple CSV to JSON converter
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) return []; // Only headers or no data

        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            let entry = {};
            headers.forEach((header, index) => {
                if (header && values[index] !== undefined) {
                    entry[header] = values[index];
                }
            });
            data.push(entry);
        }
        return data;
    }

    // Displays a message in the report area
    function displayMessage(message) {
        reportDisplay.innerHTML = `<p>${message}</p>`;
    }

    // Populates a dropdown with unique values
    function populateDropdown(dropdownElement, dataArray, key) {
        dropdownElement.innerHTML = `<option value="">-- Select a ${key.replace(' Name', '')} --</option>`;
        const uniqueValues = new Set();
        dataArray.forEach(item => {
            if (item[key] && item[key].trim() !== '') {
                uniqueValues.add(item[key].trim());
            }
        });

        Array.from(uniqueValues).sort().forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            dropdownElement.appendChild(option);
        });
    }

    // Filters data for the current month and year using string comparison
    function filterDataForCurrentMonth(data) {
        const now = new Date();
        const currentMonthString = String(now.getMonth() + 1).padStart(2, '0'); // '06' for June
        const currentYearString = String(now.getFullYear()); // '2025'

        console.log(`Filtering for Current Month (Target): ${currentMonthString}, Year: ${currentYearString}`); // Debugging

        return data.filter(entry => {
            if (entry['Date']) {
                const dateParts = entry['Date'].split('/'); // Assumes DD/MM/YYYY
                if (dateParts.length === 3) {
                    const entryMonthString = dateParts[1]; // '06'
                    const entryYearString = dateParts[2]; // '2025'

                    const isMatch = entryMonthString === currentMonthString && entryYearString === currentYearString;
                    return isMatch;
                }
            }
            return false;
        });
    }

    // Function to calculate key metrics for a given set of entries (used in multiple reports)
    function calculateMetrics(entries) {
        const metrics = {
            totalEntries: entries.length,
            visits: 0,
            calls: 0,
            references: 0,
            newCustomerLeads: 0,
            activityTypeCounts: {},
            customerTypeCounts: {},
            leadSourceCounts: {},
            productInterestedCounts: {},
            professionCounts: {}
        };

        entries.forEach(entry => {
            // Normalize activity and customer type strings
            const activity = entry['Activity Type'] ? entry['Activity Type'].trim().toLowerCase() : '';
            const customerType = entry['Type of Customer'] ? entry['Type of Customer'].trim().toLowerCase() : '';
            const leadSource = entry['Lead Source'];
            const product = entry['Prodcut Interested']; // Use original spelling from sheet
            const profession = entry['Profession'];

            // Counting based on your specific definitions (now case-insensitive and trimmed)
            // AND matching your exact predefined values (singular/plural)
            if (activity === 'visit') { // User specified 'Visit' (singular)
                metrics.visits++;
            }
            if (activity === 'calls') { // User specified 'Calls' (plural)
                metrics.calls++;
            }
            // User specified 'Referance' (typo). Check if customer is 'new' AND activity is 'referance'.
            if (customerType === 'new' && activity === 'referance') {
                metrics.references++;
            }
            if (customerType === 'new') {
                metrics.newCustomerLeads++;
            }

            // General counts for summaries (these were already working, but ensure consistency)
            if (entry['Activity Type']) metrics.activityTypeCounts[entry['Activity Type'].trim()] = (metrics.activityTypeCounts[entry['Activity Type'].trim()] || 0) + 1;
            if (entry['Type of Customer']) metrics.customerTypeCounts[entry['Type of Customer'].trim()] = (metrics.customerTypeCounts[entry['Type of Customer'].trim()] || 0) + 1;
            if (leadSource) metrics.leadSourceCounts[leadSource.trim()] = (metrics.leadSourceCounts[leadSource.trim()] || 0) + 1;
            if (product) metrics.productInterestedCounts[product.trim()] = (metrics.productInterestedCounts[product.trim()] || 0) + 1;
            if (profession) metrics.professionCounts[profession.trim()] = (metrics.professionCounts[profession.trim()] || 0) + 1;
        });

        return metrics;
    }


    // --- Rendering Functions ---

    // Renders all detailed entries for a given employee in a table
    function renderEmployeeDetailedEntries(entries) {
        if (entries.length === 0) {
            reportDisplay.innerHTML = `<p>No detailed entries found for this employee.</p>`;
            return;
        }

        const employeeName = entries[0]['Employee Name'];
        reportDisplay.innerHTML = `<h3>Detailed Entries for ${employeeName}</h3>`;

        const table = document.createElement('table');
        table.className = 'data-table';

        // Table Header
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const columnsToDisplayInTable = [
            "Timestamp", "Date", "Employee Code", "Designation",
            "Activity Type", "Type of Customer", "Lead Source",
            "How Contacted", "Prospect Name", "Phone Numebr(Whatsapp)", "Address",
            "Profession", "DOB/WD", "Prodcut Interested", "Remarks",
            "Next Follow-up Date", "Relation With Staff"
        ];
        columnsToDisplayInTable.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
        });

        // Table Body
        const tbody = table.createTBody();
        entries.forEach(entry => {
            const row = tbody.insertRow();
            columnsToDisplayInTable.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = entry[col] || ''; // Display value or empty string
            });
        });
        reportDisplay.appendChild(table);
    }

    // Renders a summary for a given employee (activity counts)
    function renderEmployeeSummary(entries) {
        const employeeName = entries[0]['Employee Name'];
        reportDisplay.innerHTML = `<h3>Activity Summary for ${employeeName}</h3>`;
        if (entries.length === 0) {
            reportDisplay.innerHTML += `<p>No entries found for this employee.</p>`;
            return;
        }

        const metrics = calculateMetrics(entries);

        let summaryHtml = `<p><strong>Total Canvassing Entries:</strong> ${metrics.totalEntries}</p>`;

        // Wrap key activity counts and breakdowns for side-by-side layout
        summaryHtml += `<div class="summary-details-container">`; // Start new container

        summaryHtml += `<div><h4>Key Activity Counts:</h4><ul class="summary-list">`;
        summaryHtml += `<li>Visits: ${metrics.visits}</li>`;
        summaryHtml += `<li>Calls: ${metrics.calls}</li>`;
        summaryHtml += `<li>References: ${metrics.references}</li>`;
        summaryHtml += `<li>New Customer Leads: ${metrics.newCustomerLeads}</li>`;
        summaryHtml += `</ul></div>`;

        summaryHtml += `<div><h4>Activity Types Breakdown:</h4><ul class="summary-list">`;
        for (const type in metrics.activityTypeCounts) {
            summaryHtml += `<li>${type}: ${metrics.activityTypeCounts[type]}</li>`;
        }
        summaryHtml += `</ul></div>`;

        summaryHtml += `<div><h4>Customer Types Breakdown:</h4><ul class="summary-list">`;
        for (const type in metrics.customerTypeCounts) {
            summaryHtml += `<li>${type}: ${metrics.customerTypeCounts[type]}</li>`;
        }
        summaryHtml += `</ul></div>`;

        summaryHtml += `<div><h4>Products Interested Breakdown:</h4><ul class="summary-list">`;
        for (const product in metrics.productInterestedCounts) {
            summaryHtml += `<li>${product}: ${metrics.productInterestedCounts[product]}</li>`;
        }
        summaryHtml += `</ul></div>`;

        summaryHtml += `</div>`; // End new container

        reportDisplay.innerHTML += summaryHtml;
    }

    // Renders a summary for all staff in a branch with key metrics per employee
    function renderBranchSummary(branchData) {
        const branchName = branchData[0]['Branch Name'];
        reportDisplay.innerHTML = `<h3>All Staff Activity Summary for ${branchName} Branch</h3>`;

        if (branchData.length === 0) {
            reportDisplay.innerHTML += `<p>No entries found for this branch.</p>`;
            return;
        }

        // Group data by employee
        const employeesInBranch = {};
        branchData.forEach(entry => {
            const employee = entry['Employee Name'];
            if (!employeesInBranch[employee]) {
                employeesInBranch[employee] = [];
            }
            employeesInBranch[employee].push(entry);
        });

        let branchSummaryHtml = `<div class="branch-summary-grid">`; // Wrapper for side-by-side cards

        // Display summary for each employee
        for (const employeeName in employeesInBranch) {
            const empEntries = employeesInBranch[employeeName];
            const metrics = calculateMetrics(empEntries); // Calculate metrics for each employee

            let empHtml = `<div class="employee-summary-card">`;
            empHtml += `<h4>${employeeName} (Total Entries: ${metrics.totalEntries})</h4>`;
            empHtml += `<p><strong>Visits:</strong> ${metrics.visits}</p>`;
            empHtml += `<p><strong>Calls:</strong> ${metrics.calls}</p>`;
            empHtml += `<p><strong>References:</strong> ${metrics.references}</p>`;
            empHtml += `<p><strong>New Customer Leads:</strong> ${metrics.newCustomerLeads}</p>`;

            // Optional: add top 3 most common activity types
            const sortedActivities = Object.entries(metrics.activityTypeCounts).sort((a,b) => b[1] - a[1]);
            if(sortedActivities.length > 0) {
                empHtml += `<p><strong>Top Activities:</strong> ${sortedActivities.slice(0, 3).map(a => `${a[0]} (${a[1]})`).join(', ')}</p>`;
            }

            empHtml += `</div>`;
            branchSummaryHtml += empHtml;
        }
        branchSummaryHtml += `</div>`; // Close wrapper
        reportDisplay.innerHTML += branchSummaryHtml;
    }


    // Renders a performance report for all staff in a branch
    function renderBranchPerformanceReport(branchData) {
        const branchName = branchData[0]['Branch Name'];
        reportDisplay.innerHTML = `<h3>All Staff Performance Report for ${branchName} Branch (This Month)</h3>`;

        if (branchData.length === 0) {
            reportDisplay.innerHTML += `<p>No entries found for this branch to generate a performance report.</p>`;
            return;
        }

        // Group data by employee
        const employeesInBranch = {};
        branchData.forEach(entry => {
            const employee = entry['Employee Name'];
            if (!employeesInBranch[employee]) {
                employeesInBranch[employee] = [];
            }
            employeesInBranch[employee].push(entry);
        });

        let performanceReportHtml = `<div class="branch-performance-grid">`; // Wrapper for side-by-side performance cards

        // Display performance for each employee
        for (const employeeName in employeesInBranch) {
            const empEntries = employeesInBranch[employeeName];
            const employeeDesignation = empEntries[0]['Designation'] || 'Default';

            // Filter entries for the current month for target tracking
            const currentMonthEntries = filterDataForCurrentMonth(empEntries);
            const actuals = calculateMetrics(currentMonthEntries);

            // Get targets based on designation
            const employeeTargets = TARGETS[employeeDesignation] || TARGETS['Default'];

            performanceReportHtml += `<div class="employee-performance-card">`;
            performanceReportHtml += `<h4>${employeeName} (${employeeDesignation})</h4>`;

            let tableHtml = `<table class="performance-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Actual</th>
                        <th>Target</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>`;

            const metricsToDisplay = ['Visit', 'Call', 'Reference', 'New Customer Leads'];

            metricsToDisplay.forEach(metric => {
                let actualValue;
                switch(metric) {
                    case 'Visit': actualValue = actuals.visits; break;
                    case 'Call': actualValue = actuals.calls; break;
                    case 'Reference': actualValue = actuals.references; break;
                    case 'New Customer Leads': actualValue = actuals.newCustomerLeads; break;
                    default: actualValue = 0;
                }

                const target = employeeTargets[metric] || 0;
                const actual = actualValue || 0;

                const percentage = target > 0 ? ((actual / target) * 100).toFixed(0) : 'N/A';
                let progressBarWidth = 0;
                if (target > 0) {
                    progressBarWidth = (actual / target) * 100;
                }

                let progressBarClass = '';
                if (progressBarWidth >= 100) {
                    progressBarClass = 'overachieved';
                    progressBarWidth = 100;
                } else if (progressBarWidth >= 90) {
                    progressBarClass = 'success';
                } else if (progressBarWidth >= 50) {
                    progressBarClass = 'warning';
                } else {
                    progressBarClass = 'danger';
                }

                // Debugging log for targets and percentages in branch performance report
                console.log(`Branch Performance Debug: Employee=${employeeName}, Metric=${metric}, Actual=${actual}, Target=${target}, Percentage=${percentage}`);


                tableHtml += `
                    <tr>
                        <td class="performance-metric">${metric}</td>
                        <td>${actual}</td>
                        <td>${target}</td>
                        <td>
                            <div class="progress-bar-container-small">
                                <div class="progress-bar ${progressBarClass}" style="width: ${progressBarWidth}%;">
                                    ${percentage !== 'N/A' ? `${percentage}%` : 'N/A'}
                                </div>
                            </div>
                        </td>
                    </tr>`;
            });

            tableHtml += `</tbody></table>`;
            performanceReportHtml += tableHtml;
            performanceReportHtml += `</div>`; // Close employee-performance-card
        }
        performanceReportHtml += `</div>`; // Close branch-performance-grid
        reportDisplay.innerHTML += performanceReportHtml;
    }


    // Renders a performance report for a single employee against targets
    function renderPerformanceReport(entries, employeeName, designation) {
        reportDisplay.innerHTML = `<h3>Performance Report for ${employeeName} (${designation || 'N/A'})</h3>`;
        if (entries.length === 0) {
            reportDisplay.innerHTML += `<p>No entries for this employee to calculate performance.</p>`;
            return;
        }

        // Filter entries for the current month for target tracking
        const currentMonthEntries = filterDataForCurrentMonth(entries);
        console.log(`Current Month Entries for ${employeeName}:`, currentMonthEntries); // Debugging line

        // Calculate actuals for the current month using the new calculateMetrics function
        const actuals = calculateMetrics(currentMonthEntries);
        console.log("Calculated Actuals for current month:", actuals); // Debugging line

        // Get targets based on designation, default if not found
        const employeeTargets = TARGETS[designation] || TARGETS['Default'];

        // Display results in a table
        let tableHtml = `<table class="performance-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Actual (This Month)</th>
                    <th>Target (Monthly)</th>
                    <th>Achievement (%)</th>
                    <th>Progress</th>
                </tr>
            </thead>
            <tbody>`;

        const metricsToDisplay = ['Visit', 'Call', 'Reference', 'New Customer Leads']; // Explicit order for display

        metricsToDisplay.forEach(metric => {
            let actualValue;
            // Map metric name to its actuals property
            switch(metric) {
                case 'Visit': actualValue = actuals.visits; break;
                case 'Call': actualValue = actuals.calls; break;
                case 'Reference': actualValue = actuals.references; break;
                case 'New Customer Leads': actualValue = actuals.newCustomerLeads; break;
                default: actualValue = 0;
            }

            const target = employeeTargets[metric] || 0;
            const actual = actualValue || 0; // Ensure it's a number

            const percentage = target > 0 ? ((actual / target) * 100).toFixed(0) : 'N/A';
            let progressBarWidth = 0;
            if (target > 0) {
                progressBarWidth = (actual / target) * 100;
            }

            let progressBarClass = '';
            if (progressBarWidth >= 100) {
                progressBarClass = 'overachieved'; // New class for over 100%
                progressBarWidth = 100; // Cap visual bar at 100%
            } else if (progressBarWidth >= 90) {
                progressBarClass = 'success';
            } else if (progressBarWidth >= 50) {
                progressBarClass = 'warning';
            } else {
                progressBarClass = 'danger';
            }

            // Debugging log for targets and percentages in single employee performance report
            console.log(`Single Employee Performance Debug: Employee=${employeeName}, Metric=${metric}, Actual=${actual}, Target=${target}, Percentage=${percentage}`);

            tableHtml += `
                <tr>
                    <td class="performance-metric">${metric}</td>
                    <td>${actual}</td>
                    <td>${target}</td>
                    <td>${percentage}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${progressBarClass}" style="width: ${progressBarWidth}%;">
                                ${percentage !== 'N/A' ? `${percentage}%` : 'N/A'}
                            </div>
                        </div>
                    </td>
                </tr>`;
        });

        tableHtml += `</tbody></table>`;
        reportDisplay.innerHTML += tableHtml;
    }

    // NEW FUNCTION: Renders an "All Branch Snapshot" report
    function renderAllBranchSnapshot() {
        if (allCanvassingData.length === 0) {
            displayMessage("No data available to create an All Branch Snapshot. Please ensure data is loaded.");
            return;
        }

        reportDisplay.innerHTML = `<h3>All Branch Snapshot (Overall Data)</h3>`;

        const branchesData = {}; // Object to store aggregated data per branch

        // Aggregate data for each unique branch
        allCanvassingData.forEach(entry => {
            const branchName = entry['Branch Name'];
            if (!branchName) return; // Skip entries without a branch name

            if (!branchesData[branchName]) {
                branchesData[branchName] = {
                    totalEntries: 0,
                    uniqueEmployees: new Set(),
                    visits: 0,
                    calls: 0,
                    references: 0,
                    newCustomerLeads: 0
                };
            }

            branchesData[branchName].totalEntries++;
            if (entry['Employee Name']) {
                branchesData[branchName].uniqueEmployees.add(entry['Employee Name']);
            }

            // Aggregate key activities (similar logic to calculateMetrics but for overall branch)
            const activity = entry['Activity Type'] ? entry['Activity Type'].trim().toLowerCase() : '';
            const customerType = entry['Type of Customer'] ? entry['Type of Customer'].trim().toLowerCase() : '';

            if (activity === 'visit') {
                branchesData[branchName].visits++;
            }
            if (activity === 'calls') {
                branchesData[branchName].calls++;
            }
            if (customerType === 'new' && activity === 'referance') {
                branchesData[branchName].references++;
            }
            if (customerType === 'new') {
                branchesData[branchName].newCustomerLeads++;
            }
        });

        let snapshotHtml = `<table class="data-table">
            <thead>
                <tr>
                    <th>Branch Name</th>
                    <th>Total Entries</th>
                    <th>Unique Employees</th>
                    <th>Total Visits</th>
                    <th>Total Calls</th>
                    <th>Total References</th>
                    <th>Total New Customer Leads</th>
                </tr>
            </thead>
            <tbody>`;

        // Sort branches alphabetically for consistent display
        const sortedBranchNames = Object.keys(branchesData).sort();

        sortedBranchNames.forEach(branchName => {
            const branchMetrics = branchesData[branchName];
            snapshotHtml += `
                <tr>
                    <td>${branchName}</td>
                    <td>${branchMetrics.totalEntries}</td>
                    <td>${branchMetrics.uniqueEmployees.size}</td>
                    <td>${branchMetrics.visits}</td>
                    <td>${branchMetrics.calls}</td>
                    <td>${branchMetrics.references}</td>
                    <td>${branchMetrics.newCustomerLeads}</td>
                </tr>`;
        });

        snapshotHtml += `</tbody></table>`;
        reportDisplay.innerHTML += snapshotHtml;

        // Reset the main controls as we are showing a global report
        branchSelect.value = "";
        employeeSelect.value = "";
        employeeFilterPanel.style.display = 'none';
        viewOptions.style.display = 'none';
    }

    // NEW FUNCTION: Renders an "All Staff Performance Report" across all branches in a single table
    function renderOverallStaffPerformanceReport() {
        if (allCanvassingData.length === 0) {
            displayMessage("No data available to create an All Staff Performance Report. Please ensure data is loaded.");
            return;
        }

        reportDisplay.innerHTML = `<h3>Overall Staff Performance Report (This Month)</h3>`;

        const employeePerformanceData = {}; // Stores aggregated data for each employee

        // First, group all entries by employee and filter for the current month
        allCanvassingData.forEach(entry => {
            const employeeName = entry['Employee Name'];
            const designation = entry['Designation'] || 'Default'; // Use actual designation or default
            if (!employeeName) return;

            if (!employeePerformanceData[employeeName]) {
                employeePerformanceData[employeeName] = {
                    designation: designation, // Store designation
                    allEntries: [], // All entries for the employee
                    currentMonthEntries: [] // Entries for the current month
                };
            }
            employeePerformanceData[employeeName].allEntries.push(entry);
        });

        // Now, filter for current month and calculate metrics for each employee
        for (const employeeName in employeePerformanceData) {
            const empData = employeePerformanceData[employeeName];
            empData.currentMonthEntries = filterDataForCurrentMonth(empData.allEntries);
            empData.actuals = calculateMetrics(empData.currentMonthEntries);
            empData.targets = TARGETS[empData.designation] || TARGETS['Default'];
        }

        // Check if there's any data for the current month to display
        const hasCurrentMonthData = Object.values(employeePerformanceData).some(emp => emp.currentMonthEntries.length > 0);
        if (!hasCurrentMonthData) {
            reportDisplay.innerHTML += `<p>No current month data found for any staff member to generate this report.</p>`;
            // Reset the main controls as we are showing a global report
            branchSelect.value = "";
            employeeSelect.value = "";
            employeeFilterPanel.style.display = 'none';
            viewOptions.style.display = 'none';
            return; // Exit if no current month data
        }

        let tableHtml = `<table class="performance-table">
            <thead>
                <tr>
                    <th rowspan="2">Employee Name</th>
                    <th rowspan="2">Branch</th>
                    <th rowspan="2">Designation</th>
                    <th colspan="3">Visit</th>
                    <th colspan="3">Call</th>
                    <th colspan="3">Reference</th>
                    <th colspan="3">New Customer Leads</th>
                </tr>
                <tr>
                    <th>Act</th><th>Tgt</th><th>%</th>
                    <th>Act</th><th>Tgt</th><th>%</th>
                    <th>Act</th><th>Tgt</th><th>%</th>
                    <th>Act</th><th>Tgt</th><th>%</th>
                    <th>Act</th><th>Tgt</th><th>%</th>
                </tr>
            </thead>
            <tbody>`;

        // Sort employees alphabetically by name for consistent display
        const sortedEmployeeNames = Object.keys(employeePerformanceData).sort();

        sortedEmployeeNames.forEach(employeeName => {
            const emp = employeePerformanceData[employeeName];
            const branchName = emp.allEntries.length > 0 ? emp.allEntries[0]['Branch Name'] : 'N/A'; // Get branch from any entry

            tableHtml += `<tr>
                <td>${employeeName}</td>
                <td>${branchName}</td>
                <td>${emp.designation}</td>
            `;

            const metricsToDisplay = ['Visit', 'Call', 'Reference', 'New Customer Leads'];

            metricsToDisplay.forEach(metric => {
                let actualValue;
                switch(metric) {
                    case 'Visit': actualValue = emp.actuals.visits; break;
                    case 'Call': actualValue = emp.actuals.calls; break;
                    case 'Reference': actualValue = emp.actuals.references; break;
                    case 'New Customer Leads': actualValue = emp.actuals.newCustomerLeads; break;
                    default: actualValue = 0;
                }

                const target = emp.targets[metric] || 0; // Ensure target defaults to 0 if undefined
                const actual = actualValue || 0;

                const percentage = target > 0 ? ((actual / target) * 100).toFixed(0) : 'N/A';
                let progressBarWidth = 0;
                if (target > 0) {
                    progressBarWidth = (actual / target) * 100;
                }

                let progressBarClass = '';
                if (progressBarWidth >= 100) {
                    progressBarClass = 'overachieved';
                    progressBarWidth = 100; // Cap visual bar at 100%
                } else if (progressBarWidth >= 90) {
                    progressBarClass = 'success';
                } else if (progressBarWidth >= 50) {
                    progressBarClass = 'warning';
                } else {
                    progressBarClass = 'danger';
                }

                // Debugging log for targets and percentages for each employee metric
                console.log(`Overall Staff Performance Debug: Employee=${employeeName}, Metric=${metric}, Actual=${actual}, Target=${target}, Percentage=${percentage}`);

                tableHtml += `
                    <td>${actual}</td>
                    <td>${target}</td>
                    <td>
                        <div class="progress-bar-container-small">
                            <div class="progress-bar ${progressBarClass}" style="width: ${progressBarWidth}%;">
                                ${percentage !== 'N/A' ? `${percentage}%` : 'N/A'}
                            </div>
                        </div>
                    </td>`;
            });

            tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table>`;
        reportDisplay.innerHTML += tableHtml;

        // Reset the main controls as we are showing a global report
        branchSelect.value = "";
        employeeSelect.value = "";
        employeeFilterPanel.style.display = 'none';
        viewOptions.style.display = 'none';
    }


    // --- Main Fetch and Event Listeners ---

    async function fetchData() {
        displayMessage("Fetching data from Google Sheet...");
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            allCanvassingData = parseCSV(csvText);
            console.log("Data loaded successfully:", allCanvassingData);

            if (allCanvassingData.length > 0) {
                populateDropdown(branchSelect, allCanvassingData, 'Branch Name');
                displayMessage("Data loaded. Select a branch for detailed reports, or click 'Reports' for an overall snapshot.");
            } else {
                displayMessage("No data found in the Google Sheet.");
            }

        } catch (error) {
            console.error("Error fetching or processing data:", error);
            displayMessage("Error loading data. Please try again later. Check browser console for details.");
            // Hide all controls if data loading fails
            branchSelect.style.display = 'none';
            employeeFilterPanel.style.display = 'none';
            viewOptions.style.display = 'none';
            if (reportsMenuBtn) reportsMenuBtn.style.display = 'none'; // Hide report menu if data fails
        }
    }

    // Event listener for Branch selection
    branchSelect.addEventListener('change', () => {
        // Hide reports dropdown if active
        if (reportsDropdown) reportsDropdown.classList.remove('show');

        const selectedBranch = branchSelect.value;
        employeeSelect.innerHTML = `<option value="">-- Select an Employee --</option>`; // Reset employee selection
        employeeFilterPanel.style.display = 'none'; // Hide employee filter panel initially
        viewOptions.style.display = 'none'; // Hide all view options initially
        reportDisplay.innerHTML = ''; // Clear report display

        if (selectedBranch) {
            filteredBranchData = allCanvassingData.filter(entry => entry['Branch Name'] === selectedBranch);

            // Populate Employee dropdown if there are employees in this branch
            populateDropdown(employeeSelect, filteredBranchData, 'Employee Name');
            employeeFilterPanel.style.display = 'block'; // Show employee filter

            // Show view options panel, and the Branch Summary button
            viewOptions.style.display = 'block';
            viewBranchSummaryBtn.style.display = 'inline-block'; // Always show Branch Summary
            viewBranchPerformanceReportBtn.style.display = 'inline-block'; // Show Branch Performance Report button

            // Hide employee-specific buttons until an employee is selected
            viewAllEntriesBtn.style.display = 'none';
            viewEmployeeSummaryBtn.style.display = 'none';
            viewPerformanceReportBtn.style.display = 'none';

            displayMessage(`Branch: ${selectedBranch}. Now select an employee or click "View All Staff Activity".`);

        } else {
            // Reset to initial state
            displayMessage("Please select a branch from the dropdown above to view reports, or click 'Reports' for an overall snapshot.");
        }
    });

    // Event listener for Employee selection
    employeeSelect.addEventListener('change', () => {
        // Hide reports dropdown if active
        if (reportsDropdown) reportsDropdown.classList.remove('show');

        const selectedEmployee = employeeSelect.value;
        reportDisplay.innerHTML = ''; // Clear report display

        // Show/hide specific view options based on employee selection
        if (selectedEmployee) {
            selectedEmployeeEntries = filteredBranchData.filter(entry => entry['Employee Name'] === selectedEmployee);
            // Show all employee-specific buttons
            viewAllEntriesBtn.style.display = 'inline-block';
            viewEmployeeSummaryBtn.style.display = 'inline-block';
            viewPerformanceReportBtn.style.display = 'inline-block';
            displayMessage(`Employee: ${selectedEmployee}. Choose a report option.`);
        } else {
            // If no employee selected, hide employee-specific buttons
            viewAllEntriesBtn.style.display = 'none';
            viewEmployeeSummaryBtn.style.display = 'none';
            viewPerformanceReportBtn.style.display = 'none';
            displayMessage(`Branch: ${branchSelect.value}. Select an employee or click "View All Staff Activity".`);
        }
    });

    // Event listeners for View Options buttons
    viewBranchSummaryBtn.addEventListener('click', () => {
        // Hide reports dropdown if active
        if (reportsDropdown) reportsDropdown.classList.remove('show');
        if (filteredBranchData.length > 0) {
            // Clear employee selection when viewing branch summary
            employeeSelect.value = "";
            viewAllEntriesBtn.style.display = 'none';
            viewEmployeeSummaryBtn.style.display = 'none';
            viewPerformanceReportBtn.style.display = 'none';
            renderBranchSummary(filteredBranchData);
        } else {
            displayMessage("No data available for this branch to summarize.");
        }
    });

    // Event listener for the "View All Staff Performance Report" button
    viewBranchPerformanceReportBtn.addEventListener('click', () => {
        // Hide reports dropdown if active
        if (reportsDropdown) reportsDropdown.classList.remove('show');
        if (filteredBranchData.length > 0) {
            // Clear employee selection when viewing branch performance report
            employeeSelect.value = "";
            viewAllEntriesBtn.style.display = 'none';
            viewEmployeeSummaryBtn.style.display = 'none';
            viewPerformanceReportBtn.style.display = 'none';
            renderBranchPerformanceReport(filteredBranchData); // Call the new rendering function
        } else {
            displayMessage("No data available for this branch to generate a performance report.");
        }
    });

    viewAllEntriesBtn.addEventListener('click', () => {
        // Hide reports dropdown if active
        if (reportsDropdown) reportsDropdown.classList.remove('show');
        if (selectedEmployeeEntries.length > 0) {
            renderEmployeeDetailedEntries(selectedEmployeeEntries);
        } else {
            displayMessage("No employee selected or no data for this employee to show detailed entries.");
        }
    });

    viewEmployeeSummaryBtn.addEventListener('click', () => {
        // Hide reports dropdown if active
        if (reportsDropdown) reportsDropdown.classList.remove('show');
        if (selectedEmployeeEntries.length > 0) {
            renderEmployeeSummary(selectedEmployeeEntries);
        } else {
            displayMessage("No employee selected or no data for this employee to show summary.");
        }
    });

    viewPerformanceReportBtn.addEventListener('click', () => {
        // Hide reports dropdown if active
        if (reportsDropdown) reportsDropdown.classList.remove('show');
        if (selectedEmployeeEntries.length > 0) {
            const employeeDesignation = selectedEmployeeEntries[0]['Designation'] || 'Default';
            renderPerformanceReport(selectedEmployeeEntries, selectedEmployeeEntries[0]['Employee Name'], employeeDesignation);
        } else {
            displayMessage("No employee selected or no data for this employee for performance report.");
        }
    });

    // NEW: Event listener for Reports Menu Button
    if (reportsMenuBtn) { // Added check in case element is not found
        reportsMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing the dropdown via body listener
            reportsDropdown.classList.toggle('show');
        });
    }

    // NEW: Event listener for All Branch Snapshot button
    if (allBranchSnapshotBtn) { // Added check in case element is not found
        allBranchSnapshotBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior (e.g., navigating)
            if (reportsDropdown) reportsDropdown.classList.remove('show'); // Hide dropdown after selection
            renderAllBranchSnapshot();
        });
    }

    // NEW: Event listener for All Staff Overall Performance button
    if (allStaffOverallPerformanceBtn) {
        allStaffOverallPerformanceBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (reportsDropdown) reportsDropdown.classList.remove('show');
            renderOverallStaffPerformanceReport();
        });
    }

    // NEW: Close the dropdown if the user clicks outside of it
    window.addEventListener('click', (event) => {
        // Check if reportsDropdown exists before trying to access its classList
        if (reportsDropdown && reportsDropdown.classList.contains('show') && !event.target.closest('.dropdown')) {
            reportsDropdown.classList.remove('show');
        }
    });


    // Initial data fetch when the page loads
    fetchData();
});
