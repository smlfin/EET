document.addEventListener('DOMContentLoaded', () => {
    // *** Configuration ***
    // This URL is for your Canvassing Data sheet. Ensure it's correct and published as CSV.
    // NOTE: If you are still getting 404, this URL is the problem.
    const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTO7LujC4VSa2wGkJ2YEYSN7UeXR221ny3THaVegYfNfRm2JQGg7QR9Bxxh9SadXtK8Pi6-psl2tGsb/pub?gid=696550092&single=true&output=csv"; 

    // IMPORTANT: Replace this with YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
    // NOTE: If you are getting errors sending data, this URL is the problem.
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzEYf0CKgwP0O4-z1lup1lDZImD1dQVEveLWsHwa_7T5ltndfIuRWXVZqFDj03_proD/exec"; // <-- PASTE YOUR NEWLY DEPLOYED WEB APP URL HERE

    // We will IGNORE MasterEmployees sheet for data fetching and report generation
    // Employee management functions in Apps Script still use the MASTER_SHEET_ID you've set up in code.gs
    // For front-end reporting, all employee and branch data will come from Canvassing Data and predefined list.
    const EMPLOYEE_MASTER_DATA_URL = "UNUSED"; // Marked as UNUSED for clarity, won't be fetched for reports

    const MONTHLY_WORKING_DAYS = 22; // Common approximation for a month's working days

    const TARGETS = {
        'Branch Manager': {
            'Visit': 10,
            'Call': 3 * MONTHLY_WORKING_DAYS,
            'Reference': 1 * MONTHLY_WORKING_DAYS,
            'New Customer Leads': 20
        },
        'Investment Staff': { // Added Investment Staff with custom Visit target
            'Visit': 30,
            'Call': 5 * MONTHLY_WORKING_DAYS,
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

    // Predefined list of branches for the dropdown and "no participation" check
    const PREDEFINED_BRANCHES = [
        "Angamaly", "Corporate Office", "Edappally", "Harippad", "Koduvayur", "Kuzhalmannam",
        "Mattanchery", "Mavelikara", "Nedumkandom", "Nenmara", "Paravoor", "Perumbavoor",
        "Thiruwillamala", "Thodupuzha", "Chengannur", "Alathur", "Kottayam", "Kattapana",
        "Muvattupuzha", "Thiruvalla", "Pathanamthitta", "HO KKM"
    ].sort();

    // --- Column Headers Mapping (IMPORTANT: These must EXACTLY match the column names in your "Form Responses 2" Google Sheet) ---
    const HEADER_TIMESTAMP = 'Timestamp';
    const HEADER_DATE = 'Date';
    const HEADER_BRANCH_NAME = 'Branch Name';
    const HEADER_EMPLOYEE_NAME = 'Employee Name';
    const HEADER_EMPLOYEE_CODE = 'Employee Code';
    const HEADER_DESIGNATION = 'Designation';
    const HEADER_ACTIVITY_TYPE = 'Activity Type';
    const HEADER_TYPE_OF_CUSTOMER = 'Type of Custome'; // Keeping user's provided typo
    const HEADER_R_LEAD_SOURCE = 'rLead Source';      // Keeping user's provided interpretation of split header
    const HEADER_HOW_CONTACTED = 'How Contacted';
    const HEADER_PROSPECT_NAME = 'Prospect Name';
    const HEADER_PHONE_NUMBER_WHATSAPP = 'Phone Numebr(Whatsapp)'; // Keeping user's provided typo
    const HEADER_ADDRESS = 'Address';
    const HEADER_PROFESSION = 'Profession';
    const HEADER_DOB_WD = 'DOB/WD';
    const HEADER_PRODUCT_INTERESTED = 'Prodcut Interested'; // Keeping user's provided typo
    const HEADER_REMARKS = 'Remarks';
    const HEADER_NEXT_FOLLOW_UP_DATE = 'Next Follow-up Date';
    const HEADER_RELATION_WITH_STAFF = 'Relation With Staff';


    // *** DOM Elements ***
    const branchSelect = document.getElementById('branchSelect');
    const employeeFilterPanel = document.getElementById('employeeFilterPanel');
    const employeeSelect = document.getElementById('employeeSelect');
    const viewOptions = document.getElementById('viewOptions');
    const viewBranchSummaryBtn = document.getElementById('viewBranchSummaryBtn');
    const viewBranchPerformanceReportBtn = document.getElementById('viewBranchPerformanceReportBtn');
    const viewEmployeeSummaryBtn = document.getElementById('viewEmployeeSummaryBtn');
    const viewAllEntriesBtn = document.getElementById('viewAllEntriesBtn');
    const viewPerformanceReportBtn = document.getElementById('viewPerformanceReportBtn');

    // Main Report Display Area
    const reportDisplay = document.getElementById('reportDisplay');
    // NEW: Dedicated message area element
    const statusMessageDiv = document.getElementById('statusMessage');


    // Tab buttons for main navigation
    const allBranchSnapshotTabBtn = document.getElementById('allBranchSnapshotTabBtn');
    const allStaffOverallPerformanceTabBtn = document.getElementById('allStaffOverallPerformanceTabBtn');
    const nonParticipatingBranchesTabBtn = document.getElementById('nonParticipatingBranchesTabBtn'); // NEW
    const employeeManagementTabBtn = document.getElementById('employeeManagementTabBtn');

    // Main Content Sections to toggle
    const reportsSection = document.getElementById('reportsSection');
    const employeeManagementSection = document.getElementById('employeeManagementSection');

    // Employee Management Form Elements
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    const newEmployeeNameInput = document.getElementById('newEmployeeName');
    const newEmployeeCodeInput = document.getElementById('newEmployeeCode');
    const newBranchNameInput = document.getElementById('newBranchName');
    const newDesignationInput = document.getElementById('newDesignation');
    const employeeManagementMessage = document.getElementById('employeeManagementMessage');

    const bulkAddEmployeeForm = document.getElementById('bulkAddEmployeeForm');
    const bulkEmployeeBranchNameInput = document.getElementById('bulkEmployeeBranchName');
    const bulkEmployeeDetailsTextarea = document.getElementById('bulkEmployeeDetails');

    const deleteEmployeeForm = document.getElementById('deleteEmployeeForm');
    const deleteEmployeeCodeInput = document.getElementById('deleteEmployeeCode');


    // Global variables to store fetched data
    let allCanvassingData = []; // Raw activity data from Form Responses 2
    let allUniqueBranches = []; // Will be populated from PREDEFINED_BRANCHES
    let allUniqueEmployees = []; // Employee codes from Canvassing Data
    let employeeCodeToNameMap = {}; // {code: name} from Canvassing Data
    let employeeCodeToDesignationMap = {}; // {code: designation} from Canvassing Data
    let selectedBranchEntries = []; // Activity entries filtered by branch
    let selectedEmployeeCodeEntries = []; // Activity entries filtered by employee code

    // Utility to format date to ISO-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toISOString().split('T')[0];
    };

    // Helper to clear and display messages in a specific div (now targets statusMessageDiv)
    function displayMessage(message, type = 'info') { 
        if (statusMessageDiv) {
            statusMessageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
            statusMessageDiv.style.display = 'block';
            setTimeout(() => {
                statusMessageDiv.innerHTML = ''; // Clear message
                statusMessageDiv.style.display = 'none';
            }, 5000); // Hide after 5 seconds
        }
    }

    // Specific message display for employee management forms
    function displayEmployeeManagementMessage(message, isError = false) {
        if (employeeManagementMessage) {
            employeeManagementMessage.textContent = message;
            employeeManagementMessage.style.color = isError ? 'red' : 'green';
            employeeManagementMessage.style.display = 'block';
            setTimeout(() => {
                employeeManagementMessage.style.display = 'none';
                employeeManagementMessage.textContent = ''; // Clear content
            }, 5000);
        }
    }

    // Function to fetch activity data from Google Sheet (Form Responses 2)
    async function fetchCanvassingData() {
        displayMessage("Fetching activity data...", 'info');
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error fetching Canvassing Data! Status: ${response.status}. Details: ${errorText}`);
                throw new Error(`Failed to fetch canvassing data. Status: ${response.status}. Please check DATA_URL.`);
            }
            const csvText = await response.text();
            allCanvassingData = parseCSV(csvText);
            console.log('--- Fetched Canvassing Data: ---');
            console.log(allCanvassingData); // Log canvassing data for debugging
            if (allCanvassingData.length > 0) {
                console.log('Canvassing Data Headers (first entry):', Object.keys(allCanvassingData[0]));
            }
            displayMessage("Activity data loaded successfully!", 'success');
        } catch (error) {
            console.error('Error fetching canvassing data:', error);
            displayMessage(`Failed to load activity data: ${error.message}. Please ensure the sheet is published correctly to CSV and the URL is accurate.`, 'error');
            allCanvassingData = [];
        }
    }

    // CSV parsing function (handles commas within quoted strings)
    function parseCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];

        const headers = parseCSVLine(lines[0]); // Headers can also contain commas in quotes
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                console.warn(`Skipping malformed row ${i + 1}: Expected ${headers.length} columns, got ${values.length}. Line: "${lines[i]}"`);
                continue;
            }
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index];
            });
            data.push(entry);
        }
        return data;
    }

    // Helper to parse a single CSV line safely
    function parseCSVLine(line) {
        const result = [];
        let inQuote = false;
        let currentField = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField.trim());
        return result;
    }


    // Process fetched data to populate filters and prepare for reports
    async function processData() {
        // Only fetch canvassing data, ignoring MasterEmployees for front-end reports
        await fetchCanvassingData(); 

        // Re-initialize allUniqueBranches from the predefined list
        allUniqueBranches = [...PREDEFINED_BRANCHES].sort(); // Use the hardcoded list

        // Populate employeeCodeToNameMap and employeeCodeToDesignationMap ONLY from Canvassing Data
        employeeCodeToNameMap = {}; // Reset map before populating
        employeeCodeToDesignationMap = {}; // Reset map before populating
        allCanvassingData.forEach(entry => {
            const employeeCode = entry[HEADER_EMPLOYEE_CODE];
            const employeeName = entry[HEADER_EMPLOYEE_NAME];
            const designation = entry[HEADER_DESIGNATION];

            if (employeeCode) {
                // If an employee code exists in canvassing data, use its name/designation
                employeeCodeToNameMap[employeeCode] = employeeName || employeeCode;
                employeeCodeToDesignationMap[employeeCode] = designation || 'Default';
            }
        });

        // Re-populate allUniqueEmployees based ONLY on canvassing data
        allUniqueEmployees = [...new Set(allCanvassingData.map(entry => entry[HEADER_EMPLOYEE_CODE]))].sort((codeA, codeB) => {
            const nameA = employeeCodeToNameMap[codeA] || codeA;
            const nameB = employeeCodeToNameMap[codeB] || codeB;
            return nameA.localeCompare(nameB);
        });

        populateDropdown(branchSelect, allUniqueBranches); // Populate branch dropdown with predefined branches
        console.log('Final All Unique Branches (Predefined):', allUniqueBranches);
        console.log('Final Employee Code To Name Map (from Canvassing Data):', employeeCodeToNameMap);
        console.log('Final Employee Code To Designation Map (from Canvassing Data):', employeeCodeToDesignationMap);
        console.log('Final All Unique Employees (Codes from Canvassing Data):', allUniqueEmployees);

        // After data is loaded and maps are populated, render the initial report
        renderAllBranchSnapshot(); // Render the default "All Branch Snapshot" report
    }

    // Populate dropdown utility
    function populateDropdown(selectElement, items, useCodeForValue = false) {
        selectElement.innerHTML = '<option value="">-- Select --</option>'; // Default option
        items.forEach(item => {
            const option = document.createElement('option');
            if (useCodeForValue) {
                // Display name from map or code itself
                option.value = item; // item is employeeCode
                option.textContent = employeeCodeToNameMap[item] || item;
            } else {
                option.value = item; // item is branch name
                option.textContent = item;
            }
            selectElement.appendChild(option);
        });
    }

    // Filter employees based on selected branch
    branchSelect.addEventListener('change', () => {
        const selectedBranch = branchSelect.value;
        if (selectedBranch) {
            employeeFilterPanel.style.display = 'block';

            // Get employee codes ONLY from Canvassing Data for the selected branch
            const employeeCodesInBranchFromCanvassing = allCanvassingData
                .filter(entry => entry[HEADER_BRANCH_NAME] === selectedBranch)
                .map(entry => entry[HEADER_EMPLOYEE_CODE]);

            // Combine and unique all employee codes for the selected branch
            const combinedEmployeeCodes = new Set([
                ...employeeCodesInBranchFromCanvassing
            ]);

            // Convert Set back to array and sort
            const sortedEmployeeCodesInBranch = [...combinedEmployeeCodes].sort((codeA, codeB) => {
                // Use the name from the map if available, otherwise use the code for sorting and display
                const nameA = employeeCodeToNameMap[codeA] || codeA;
                const nameB = employeeCodeToNameMap[codeB] || codeB;
                return nameA.localeCompare(nameB);
            });

            populateDropdown(employeeSelect, sortedEmployeeCodesInBranch, true);
            viewOptions.style.display = 'flex'; // Show view options
            // Reset employee selection and employee-specific display when branch changes
            employeeSelect.value = "";
            selectedEmployeeCodeEntries = []; // Clear previous activity filter
            reportDisplay.innerHTML = '<p>Select an employee or choose a report option.</p>';
        } else {
            employeeFilterPanel.style.display = 'none';
            viewOptions.style.display = 'none'; // Hide view options
            reportDisplay.innerHTML = '<p>Please select a branch from the dropdown above to view reports.</p>';
            selectedBranchEntries = []; // Clear previous activity filter
            selectedEmployeeCodeEntries = []; // Clear previous activity filter
        }
    });

    // Handle employee selection (now based on employee CODE)
    employeeSelect.addEventListener('change', () => {
        const selectedEmployeeCode = employeeSelect.value;
        if (selectedEmployeeCode) {
            // Filter activity data by employee code (from allCanvassingData)
            selectedEmployeeCodeEntries = allCanvassingData.filter(entry =>
                entry[HEADER_EMPLOYEE_CODE] === selectedEmployeeCode &&
                entry[HEADER_BRANCH_NAME] === branchSelect.value // Filter by selected branch as well
            );
            const employeeDisplayName = employeeCodeToNameMap[selectedEmployeeCode] || selectedEmployeeCode;
            reportDisplay.innerHTML = `<p>Ready to view reports for ${employeeDisplayName}.</p>`;
        } else {
            selectedEmployeeCodeEntries = []; // Clear previous activity filter
            reportDisplay.innerHTML = '<p>Select an employee or choose a report option.</p>';
        }
    });

    // Helper to calculate total activity from a set of activity entries based on Activity Type
    function calculateTotalActivity(entries) {
        const totalActivity = { 'Visit': 0, 'Call': 0, 'Reference': 0, 'New Customer Leads': 0 }; // Initialize counters
        const productInterests = new Set(); // To collect unique product interests
        
        console.log('Calculating total activity for entries:', entries.length); // Log entries being processed
        entries.forEach((entry, index) => {
            let activityType = entry[HEADER_ACTIVITY_TYPE];
            let typeOfCustomer = entry[HEADER_TYPE_OF_CUSTOMER];
            let productInterested = entry[HEADER_PRODUCT_INTERESTED]; // Get product interested

            // Trim and convert to lowercase for robust comparison
            const trimmedActivityType = activityType ? activityType.trim().toLowerCase() : '';
            const trimmedTypeOfCustomer = typeOfCustomer ? typeOfCustomer.trim().toLowerCase() : '';
            const trimmedProductInterested = productInterested ? productInterested.trim() : ''; // Don't lowercase products unless explicitly asked

            console.log(`--- Entry ${index + 1} Debug ---`);
            console.log(`  Processed Activity Type (trimmed, lowercase): '${trimmedActivityType}'`);
            console.log(`  Processed Type of Customer (trimmed, lowercase): '${trimmedTypeOfCustomer}'`);
            console.log(`  Processed Product Interested (trimmed): '${trimmedProductInterested}'`);


            // Direct matching to user's provided sheet values (now lowercase)
            if (trimmedActivityType === 'visit') {
                totalActivity['Visit']++;
            } else if (trimmedActivityType === 'calls') { // Matches "Calls" from sheet, now lowercase
                totalActivity['Call']++;
            } else if (trimmedActivityType === 'referance') { // Matches "Referance" (with typo) from sheet, now lowercase
                totalActivity['Reference']++;
            } else {
                // If it's not one of the direct activity types, log for debugging
                console.warn(`  Unknown or unhandled Activity Type encountered (trimmed, lowercase): '${trimmedActivityType}'.`);
            }
            
            // --- UPDATED LOGIC FOR 'New Customer Leads' ---
            // Based on the user's previously working script, New Customer Leads are counted
            // if the 'Type of Custome' is simply 'new', regardless of 'Activity Type'.
            if (trimmedTypeOfCustomer === 'new') {
                totalActivity['New Customer Leads']++;
                console.log(`  New Customer Lead INCREMENTED based on Type of Custome === 'new'.`);
            } else {
                console.log(`  New Customer Lead NOT INCREMENTED: Type of Custome is not 'new'.`);
            }
            // --- END UPDATED LOGIC ---

            // Collect unique product interests
            if (trimmedProductInterested) {
                productInterests.add(trimmedProductInterested);
            }
            console.log(`--- End Entry ${index + 1} Debug ---`);
        });
        console.log('Calculated Total Activity Final:', totalActivity);
        
        // Return both total activities and product interests
        return { totalActivity, productInterests: [...productInterests] };
    }

    // Render All Branch Snapshot (now uses PREDEFINED_BRANCHES and checks for participation)
    function renderAllBranchSnapshot() {
        reportDisplay.innerHTML = '<h2>All Branch Snapshot</h2>';
        
        const table = document.createElement('table');
        table.className = 'all-branch-snapshot-table';
        
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['Branch Name', 'Employees with Activity', 'Total Visits', 'Total Calls', 'Total References', 'Total New Customer Leads'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();

        PREDEFINED_BRANCHES.forEach(branch => {
            const branchActivityEntries = allCanvassingData.filter(entry => entry[HEADER_BRANCH_NAME] === branch);
            const { totalActivity } = calculateTotalActivity(branchActivityEntries); // Destructure to get totalActivity
            const employeeCodesInBranch = [...new Set(branchActivityEntries.map(entry => entry[HEADER_EMPLOYEE_CODE]))];
            const displayEmployeeCount = employeeCodesInBranch.length;

            const row = tbody.insertRow();
            // Assign data-label for mobile view
            row.insertCell().setAttribute('data-label', 'Branch Name');
            row.lastChild.textContent = branch;

            row.insertCell().setAttribute('data-label', 'Employees with Activity');
            row.lastChild.textContent = displayEmployeeCount;

            row.insertCell().setAttribute('data-label', 'Total Visits');
            row.lastChild.textContent = totalActivity['Visit'];

            row.insertCell().setAttribute('data-label', 'Total Calls');
            row.lastChild.textContent = totalActivity['Call'];

            row.insertCell().setAttribute('data-label', 'Total References');
            row.lastChild.textContent = totalActivity['Reference'];

            row.insertCell().setAttribute('data-label', 'Total New Customer Leads');
            row.lastChild.textContent = totalActivity['New Customer Leads'];
        });

        reportDisplay.appendChild(table);
    }

    // NEW: Render Non-Participating Branches Report
    function renderNonParticipatingBranches() {
        reportDisplay.innerHTML = '<h2>Non-Participating Branches</h2>';
        const nonParticipatingBranches = [];

        PREDEFINED_BRANCHES.forEach(branch => {
            const hasActivity = allCanvassingData.some(entry => entry[HEADER_BRANCH_NAME] === branch);
            if (!hasActivity) {
                nonParticipatingBranches.push(branch);
            }
        });

        if (nonParticipatingBranches.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'non-participating-branch-list';
            nonParticipatingBranches.forEach(branch => {
                const li = document.createElement('li');
                li.textContent = branch;
                ul.appendChild(li);
            });
            reportDisplay.appendChild(ul);
        } else {
            reportDisplay.innerHTML += '<p class="no-participation-message">All predefined branches have recorded activity!</p>';
        }
    }


    // Render All Staff Overall Performance Report (now uses allUniqueEmployees from canvassing data)
    function renderOverallStaffPerformanceReport() {
        reportDisplay.innerHTML = '<h2>All Staff Overall Performance Report</h2><div class="branch-performance-grid"></div>';
        const performanceGrid = reportDisplay.querySelector('.branch-performance-grid');

        if (allUniqueEmployees.length === 0) {
            performanceGrid.innerHTML = '<p>No employee activity data found to generate overall staff performance report.</p>';
            return;
        }

        allUniqueEmployees.forEach(employeeCode => {
            // Get activity data for this specific employee code across all branches
            const employeeActivityEntries = allCanvassingData.filter(entry => entry[HEADER_EMPLOYEE_CODE] === employeeCode);

            const { totalActivity } = calculateTotalActivity(employeeActivityEntries); // Destructure
            // Name and designation will be from `employeeCodeToNameMap` which is populated from canvassing data
            const employeeName = employeeCodeToNameMap[employeeCode] || employeeCode;
            const designation = employeeCodeToDesignationMap[employeeCode] || 'Default'; // Use map, default if not found

            const targets = TARGETS[designation] || TARGETS['Default'];
            const performance = calculatePerformance(totalActivity, targets);

            const employeeCard = document.createElement('div');
            employeeCard.className = 'employee-performance-card';
            employeeCard.innerHTML = `<h3>${employeeName} (${designation})</h3>
                                    <div style="overflow-x: auto;"> <!-- Wrapper for table scroll -->
                                    <table class="performance-table">
                                        <thead>
                                            <tr><th>Metric</th><th>Actual</th><th>Target</th><th>% Achieved</th></tr>
                                        </thead>
                                        <tbody>
                                            ${Object.keys(targets).map(metric => {
                                                const actualValue = totalActivity[metric] || 0;
                                                const targetValue = targets[metric];
                                                let percentValue = performance[metric]; // Raw numerical percentage
                                                
                                                let displayPercent;
                                                let progressWidth;
                                                let progressBarClass;

                                                if (isNaN(percentValue)) { // Check for NaN (e.g., target is 0)
                                                    displayPercent = 'N/A';
                                                    progressWidth = 0;
                                                    progressBarClass = 'no-activity';
                                                } else {
                                                    displayPercent = `${Math.round(percentValue)}%`; // Round to nearest whole number
                                                    progressWidth = Math.min(100, Math.round(percentValue)); // Round for width
                                                    progressBarClass = getProgressBarClass(percentValue); // Use original float for color
                                                }

                                                // Special handling for 0 actuals with positive targets
                                                if (actualValue === 0 && targetValue > 0) {
                                                    displayPercent = '0%';
                                                    progressWidth = 0;
                                                    progressBarClass = 'danger'; // Red if 0% and target exists
                                                }

                                                return `
                                                    <tr>
                                                        <td data-label="Metric">${metric}</td>
                                                        <td data-label="Actual">${actualValue}</td>
                                                        <td data-label="Target">${targetValue}</td>
                                                        <td data-label="% Achieved">
                                                            <div class="progress-bar-container-small">
                                                                <div class="progress-bar ${progressBarClass}" style="width: ${progressWidth === 0 && displayPercent !== 'N/A' ? '30px' : progressWidth}%">${displayPercent}</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                    </div>`; {/* Close wrapper */}
            performanceGrid.appendChild(employeeCard);
        });
    }

    // Function to calculate performance percentage
    function calculatePerformance(actual, target) {
        const performance = {};
        for (const key in actual) {
            if (target[key] !== undefined && target[key] > 0) {
                performance[key] = (actual[key] / target[key]) * 100; // Return number, not fixed string
            } else {
                performance[key] = NaN; // Use NaN for "N/A" cases (e.g., target is 0 or undefined)
            }
        }
        return performance;
    }

    // Helper for progress bar styling
    function getProgressBarClass(percentage) {
        if (isNaN(percentage)) return 'no-activity'; // Check for NaN
        const p = parseFloat(percentage);
        if (p >= 100) return 'overachieved';
        if (p >= 75) return 'success';
        if (p >= 50) return 'warning';
        return 'danger';
    }


    // Refactored: Render Branch Activity Summary (consolidated branch totals)
    function renderBranchSummary() {
        const selectedBranch = branchSelect.value;
        if (!selectedBranch) {
            reportDisplay.innerHTML = '<p>Please select a branch first to view its activity summary.</p>';
            return;
        }

        const branchActivity = allCanvassingData.filter(entry => entry[HEADER_BRANCH_NAME] === selectedBranch);

        if (branchActivity.length === 0) {
            reportDisplay.innerHTML = `<h2>Branch Activity Summary for ${selectedBranch}</h2>
                                       <p class="no-participation-message">No activity recorded for this branch.</p>
                                       <ul class="summary-list">
                                           <li><strong>Total Visits:</strong> 0</li>
                                           <li><strong>Total Calls:</strong> 0</li>
                                           <li><strong>Total References:</strong> 0</li>
                                           <li><strong>Total New Customer Leads:</strong> 0</li>
                                       </ul>`;
            return;
        }

        const { totalActivity } = calculateTotalActivity(branchActivity);

        // Display as a single summary card for the branch
        reportDisplay.innerHTML = `
            <h2>Branch Activity Summary for ${selectedBranch}</h2>
            <div class="branch-summary-card-single">
                <h3>Overall Metrics for ${selectedBranch}</h3>
                <ul class="summary-list">
                    <li><strong>Total Visits:</strong> ${totalActivity['Visit']}</li>
                    <li><strong>Total Calls:</strong> ${totalActivity['Call']}</li>
                    <li><strong>Total References:</strong> ${totalActivity['Reference']}</li>
                    <li><strong>Total New Customer Leads:</strong> ${totalActivity['New Customer Leads']}</li>
                </ul>
            </div>
        `;
    }

    // Render Employee Detailed Entries (uses selectedEmployeeCodeEntries which are activity entries)
    function renderEmployeeDetailedEntries(employeeCodeEntries) {
        if (employeeCodeEntries.length === 0) {
            reportDisplay.innerHTML = '<p>No detailed activity entries for this employee code.</p>';
            return;
        }

        const employeeDisplayName = employeeCodeToNameMap[employeeCodeEntries[0][HEADER_EMPLOYEE_CODE]] || employeeCodeEntries[0][HEADER_EMPLOYEE_CODE];
        reportDisplay.innerHTML = `<h2>Detailed Entries for ${employeeDisplayName}</h2>`;

        const tableContainer = document.createElement('div'); // NEW: Wrapper for scroll
        tableContainer.className = 'data-table-container';

        const table = document.createElement('table');
        table.className = 'data-table';
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        
        // Define the headers you want to show in the detailed table
        // These MUST EXACTLY match your actual Canvassing Data sheet headers
        const headersToShow = [
            HEADER_TIMESTAMP, 
            HEADER_DATE,
            HEADER_BRANCH_NAME,
            HEADER_EMPLOYEE_NAME,
            HEADER_EMPLOYEE_CODE,
            HEADER_DESIGNATION,
            HEADER_ACTIVITY_TYPE,
            HEADER_TYPE_OF_CUSTOMER,
            HEADER_R_LEAD_SOURCE,
            HEADER_HOW_CONTACTED,
            HEADER_PROSPECT_NAME,
            HEADER_PHONE_NUMBER_WHATSAPP,
            HEADER_ADDRESS,
            HEADER_PROFESSION,
            HEADER_DOB_WD,
            HEADER_PRODUCT_INTERESTED,
            HEADER_REMARKS,
            HEADER_NEXT_FOLLOW_UP_DATE,
            HEADER_RELATION_WITH_STAFF
        ];

        // Ensure only headers that actually exist in the data are displayed
        // This is a safety check; ideally, all 'headersToShow' exist in the CSV.
        const actualHeadersInFirstEntry = Object.keys(employeeCodeEntries[0]);
        const finalHeaders = headersToShow.filter(header => actualHeadersInFirstEntry.includes(header));


        finalHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        employeeCodeEntries.forEach(entry => {
            const row = tbody.insertRow();
            finalHeaders.forEach(header => {
                const cell = row.insertCell();
                if (header === HEADER_TIMESTAMP || header === HEADER_DATE || header === HEADER_NEXT_FOLLOW_UP_DATE || header === HEADER_DOB_WD) {
                    cell.textContent = formatDate(entry[header]);
                } else {
                    cell.textContent = entry[header];
                }
                // Add data-label attribute for mobile responsiveness
                cell.setAttribute('data-label', header); 
            });
        });

        tableContainer.appendChild(table); // Append table to container
        reportDisplay.appendChild(tableContainer); // Append container to display area
    }

    // Render Employee Summary (Current Month) - now includes Product Interested
    function renderEmployeeSummary(employeeCodeEntries) {
        if (employeeCodeEntries.length === 0) {
            reportDisplay.innerHTML = '<p>No activity data for this employee for the selected period.</p>';
            return;
        }

        const employeeDisplayName = employeeCodeToNameMap[employeeCodeEntries[0][HEADER_EMPLOYEE_CODE]] || employeeCodeEntries[0][HEADER_EMPLOYEE_CODE];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentMonthEntries = employeeCodeEntries.filter(entry => {
            const entryDate = new Date(entry[HEADER_TIMESTAMP]);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        });

        const { totalActivity, productInterests } = calculateTotalActivity(currentMonthEntries); // Get both

        let productInterestHtml = '';
        if (productInterests.length > 0) {
            productInterestHtml = `
                <h4>Products Interested:</h4>
                <ul class="product-interest-list">
                    ${productInterests.map(product => `<li>${product}</li>`).join('')}
                </ul>
            `;
        } else {
            productInterestHtml = '<p>No specific product interests recorded this month.</p>';
        }


        reportDisplay.innerHTML = `<h2>Employee Summary for ${employeeDisplayName} (Current Month)</h2>
                                   <ul class="summary-list">
                                       <li><strong>Total Visits:</strong> ${totalActivity['Visit']}</li>
                                       <li><strong>Total Calls:</b> ${totalActivity['Call']}</li>
                                       <li><strong>Total References:</strong> ${totalActivity['Reference']}</li>
                                       <li><strong>Total New Customer Leads:</strong> ${totalActivity['New Customer Leads']}</li>
                                   </ul>
                                   ${productInterestHtml}`;
    }

    // Render Employee Performance Report (uses selectedEmployeeCodeEntries (activity entries))
    function renderPerformanceReport(employeeCodeEntries) {
        const selectedEmployeeCode = employeeSelect.value;
        if (!selectedEmployeeCode) {
            reportDisplay.innerHTML = '<p>Please select an employee to view performance report.</p>';
            return;
        }
        
        const employeeName = employeeCodeToNameMap[selectedEmployeeCode] || selectedEmployeeCode;
        const designation = employeeCodeToDesignationMap[selectedEmployeeCode] || 'Default';

        reportDisplay.innerHTML = `<h2>Performance Report for ${employeeName} (${designation})</h2>`;

        const { totalActivity } = calculateTotalActivity(employeeCodeEntries); // Destructure
        const targets = TARGETS[designation] || TARGETS['Default'];
        const performance = calculatePerformance(totalActivity, targets);

        const performanceDiv = document.createElement('div');
        performanceDiv.className = 'performance-report';

        const performanceTableHtml = `
            <div style="overflow-x: auto;"> <!-- Wrapper for table scroll -->
            <table class="performance-table">
                <thead>
                    <tr><th>Metric</th><th>Actual</th><th>Target</th><th>% Achieved</th></tr>
                </thead>
                <tbody>
                    ${Object.keys(targets).map(metric => {
                        const actualValue = totalActivity[metric] || 0;
                        const targetValue = targets[metric];
                        let percentValue = performance[metric]; // Raw numerical percentage
                        
                        let displayPercent;
                        let progressWidth;
                        let progressBarClass;

                        if (isNaN(percentValue)) { // Check for NaN (e.g., target is 0)
                            displayPercent = 'N/A';
                            progressWidth = 0;
                            progressBarClass = 'no-activity';
                        } else {
                            displayPercent = `${Math.round(percentValue)}%`; // Round to nearest whole number
                            progressWidth = Math.min(100, Math.round(percentValue)); // Round for width
                            progressBarClass = getProgressBarClass(percentValue); // Use original float for color
                        }

                        // Special handling for 0 actuals with positive targets
                        if (actualValue === 0 && targetValue > 0) {
                            displayPercent = '0%';
                            progressWidth = 0;
                            progressBarClass = 'danger'; // Red if 0% and target exists
                        }

                        return `
                            <tr>
                                <td data-label="Metric">${metric}</td>
                                <td data-label="Actual">${actualValue}</td>
                                <td data-label="Target">${targetValue}</td>
                                <td data-label="% Achieved">
                                    <div class="progress-bar-container">
                                        <div class="progress-bar ${progressBarClass}" style="width: ${progressWidth === 0 && displayPercent !== 'N/A' ? '30px' : progressWidth}%">${displayPercent}</div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            </div>`; {/* Close wrapper */}


        if (employeeCodeEntries.length === 0) {
            performanceDiv.innerHTML = `<p class="no-participation-message">No activity data submitted for this employee, but showing targets.</p>` + performanceTableHtml;
        } else {
            performanceDiv.innerHTML = `
                <h3>Overall Performance</h3>
                ${performanceTableHtml}
                <div class="summary-details-container">
                    <div>
                        <h4>Activity Breakdown by Date</h4>
                        <ul class="summary-list">
                            ${employeeCodeEntries.map(entry => {
                                const activityType = entry[HEADER_ACTIVITY_TYPE] ? entry[HEADER_ACTIVITY_TYPE].trim().toLowerCase() : '';
                                const typeOfCustomer = entry[HEADER_TYPE_OF_CUSTOMER] ? entry[HEADER_TYPE_OF_CUSTOMER].trim().toLowerCase() : '';
                                const isVisit = activityType === 'visit';
                                const isCall = activityType === 'calls';
                                const isReference = activityType === 'referance';
                                const isNewLead = (isVisit || isCall) && typeOfCustomer === 'new'; 
                                return `
                                <li>${formatDate(entry[HEADER_TIMESTAMP])}:
                                    V:${isVisit ? 1 : 0} |
                                    C:${isCall ? 1 : 0} |
                                    R:${isReference ? 1 : 0} |
                                    L:${isNewLead ? 1 : 0}
                                </li>`;
                            }).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }
        reportDisplay.appendChild(performanceDiv);
    }

    // Function to send data to Google Apps Script
    async function sendDataToGoogleAppsScript(actionType, data = {}) {
        displayEmployeeManagementMessage('Processing request...', false);

        try {
            const formData = new URLSearchParams();
            formData.append('actionType', actionType);
            formData.append('data', JSON.stringify(data));

            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error from Apps Script! Status: ${response.status}. Details: ${errorText}`);
                throw new Error(`Failed to send data to Apps Script. Status: ${response.status}. Please check WEB_APP_URL and Apps Script deployment.`);
            }

            const result = await response.json();

            if (result.status === 'SUCCESS') {
                displayEmployeeManagementMessage(result.message, false);
                return true;
            } else {
                displayEmployeeManagementMessage(`Error: ${result.message}`, true);
                return false;
            }
        } catch (error) {
            console.error('Error sending data to Apps Script:', error);
            displayEmployeeManagementMessage(`Error sending data: ${error.message}. Please check WEB_APP_URL and Apps Script deployment.`, true);
            return false;
        } finally {
            // Re-fetch all data to ensure reports are up-to-date after any employee management action
            await processData(); // Re-fetch canvassing data and re-populate maps/dropdowns
            // Re-render the current report or provide a message
            const activeTabButton = document.querySelector('.tab-button.active');
            if (activeTabButton && reportsSection.style.display === 'block') { // Only re-render if we're on a reports tab
                if (activeTabButton.id === 'allBranchSnapshotTabBtn') {
                    renderAllBranchSnapshot();
                } else if (activeTabButton.id === 'allStaffOverallPerformanceTabBtn') {
                    renderOverallStaffPerformanceReport();
                } else if (activeTabButton.id === 'nonParticipatingBranchesTabBtn') {
                    renderNonParticipatingBranches();
                }
                else if (branchSelect.value) { // If a branch is selected, try to re-render relevant reports
                    const lastViewedReportButton = document.querySelector('.view-options button.active');
                    if (lastViewedReportButton) {
                        lastViewedReportButton.click(); // Simulate click on the last active report button
                    } else { // Default to branch summary if no specific report was active
                        renderBranchSummary(); // No argument needed now
                    }
                }
            }
        }
    }


    // Event Listeners for main report buttons
    // Added active class logic to report buttons
    viewBranchSummaryBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options button').forEach(btn => btn.classList.remove('active'));
        viewBranchSummaryBtn.classList.add('active');
        // renderBranchSummary no longer needs an argument as it directly uses branchSelect.value
        renderBranchSummary(); 
    });

    viewBranchPerformanceReportBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options button').forEach(btn => btn.classList.remove('active'));
        viewBranchPerformanceReportBtn.classList.add('active');
        const selectedBranch = branchSelect.value;
        if (selectedBranch) {
            const branchActivityEntries = allCanvassingData.filter(entry => entry[HEADER_BRANCH_NAME] === selectedBranch);
            renderOverallStaffPerformanceReportForBranch(selectedBranch, branchActivityEntries);
        } else {
            displayMessage("No branch selected to show performance report.");
        }
    });

    // Helper for branch performance report (similar to overall staff performance, but for a specific branch)
    function renderOverallStaffPerformanceReportForBranch(branchName, branchActivityEntries) {
        reportDisplay.innerHTML = `<h2>All Staff Performance for ${branchName}</h2><div class="branch-performance-grid"></div>`;
        const performanceGrid = reportDisplay.querySelector('.branch-performance-grid');

        // Get all unique employee codes within this branch from canvassing data only
        const uniqueEmployeeCodesInBranch = [...new Set(branchActivityEntries.map(e => e[HEADER_EMPLOYEE_CODE]))];

        if (uniqueEmployeeCodesInBranch.length === 0) {
            performanceGrid.innerHTML = `<p class="no-participation-message">No employee activity data found for ${branchName} to generate performance report.</p>`;
            return;
        }

        uniqueEmployeeCodesInBranch.forEach(employeeCode => {
            // Filter activity data only for this employee code within the branch's activity entries
            const employeeActivities = branchActivityEntries.filter(entry => entry[HEADER_EMPLOYEE_CODE] === employeeCode);
            
            const { totalActivity } = calculateTotalActivity(employeeActivities); // Destructure
            const employeeDisplayName = employeeCodeToNameMap[employeeCode] || employeeCode; // Use name from map or code
            const designation = employeeCodeToDesignationMap[employeeCode] || 'Default';

            const targets = TARGETS[designation] || TARGETS['Default'];
            const performance = calculatePerformance(totalActivity, targets);

            const employeeCard = document.createElement('div');
            employeeCard.className = 'employee-performance-card';
            employeeCard.innerHTML = `<h3>${employeeDisplayName} (${designation})</h3>
                                    <div style="overflow-x: auto;"> <!-- Wrapper for table scroll -->
                                    <table class="performance-table">
                                        <thead>
                                            <tr><th>Metric</th><th>Actual</th><th>Target</th><th>% Achieved</th></tr>
                                        </thead>
                                        <tbody>
                                            ${Object.keys(targets).map(metric => {
                                                const actualValue = totalActivity[metric] || 0;
                                                const targetValue = targets[metric];
                                                let percentValue = performance[metric]; // Raw numerical percentage
                                                
                                                let displayPercent;
                                                let progressWidth;
                                                let progressBarClass;

                                                if (isNaN(percentValue)) { // Check for NaN (e.g., target is 0)
                                                    displayPercent = 'N/A';
                                                    progressWidth = 0;
                                                    progressBarClass = 'no-activity';
                                                } else {
                                                    displayPercent = `${Math.round(percentValue)}%`; // Round to nearest whole number
                                                    progressWidth = Math.min(100, Math.round(percentValue)); // Round for width
                                                    progressBarClass = getProgressBarClass(percentValue); // Use original float for color
                                                }

                                                // Special handling for 0 actuals with positive targets
                                                if (actualValue === 0 && targetValue > 0) {
                                                    displayPercent = '0%';
                                                    progressWidth = 0;
                                                    progressBarClass = 'danger'; // Red if 0% and target exists
                                                }

                                                return `
                                                    <tr>
                                                        <td data-label="Metric">${metric}</td>
                                                        <td data-label="Actual">${actualValue}</td>
                                                        <td data-label="Target">${targetValue}</td>
                                                        <td data-label="% Achieved">
                                                            <div class="progress-bar-container-small">
                                                                <div class="progress-bar ${progressBarClass}" style="width: ${progressWidth === 0 && displayPercent !== 'N/A' ? '30px' : progressWidth}%">${displayPercent}</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                    </div>`; {/* Close wrapper */}
            performanceGrid.appendChild(employeeCard);
        });
    }

    viewAllEntriesBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options button').forEach(btn => btn.classList.remove('active'));
        viewAllEntriesBtn.classList.add('active');
        if (selectedEmployeeCodeEntries.length > 0) {
            renderEmployeeDetailedEntries(selectedEmployeeCodeEntries);
        } else {
            displayMessage("No employee selected or no activity data for this employee to show detailed entries.");
        }
    });

    viewEmployeeSummaryBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options button').forEach(btn => btn.classList.remove('active'));
        viewEmployeeSummaryBtn.classList.add('active');
        if (selectedEmployeeCodeEntries.length > 0) {
            renderEmployeeSummary(selectedEmployeeCodeEntries);
        } else {
            displayMessage("No employee selected or no activity data for this employee to show summary.");
        }
    });

    viewPerformanceReportBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options button').forEach(btn => btn.classList.remove('active'));
        viewPerformanceReportBtn.classList.add('active');
        const selectedEmployeeCode = employeeSelect.value;
        if (selectedEmployeeCode) {
            const employeeActivityEntries = allCanvassingData.filter(entry => entry[HEADER_EMPLOYEE_CODE] === selectedEmployeeCode);
            renderPerformanceReport(employeeActivityEntries); // This function handles zero activity
        } else {
            displayMessage("Please select an employee to view performance report.");
        }
    });

    // Function to manage tab visibility
    function showTab(tabButtonId) {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.getElementById(tabButtonId).classList.add('active');

        reportsSection.style.display = 'none';
        employeeManagementSection.style.display = 'none';
        
        // Clear active state for report sub-buttons when changing main tabs
        document.querySelectorAll('.view-options button').forEach(btn => btn.classList.remove('active'));


        if (tabButtonId === 'allBranchSnapshotTabBtn' || tabButtonId === 'allStaffOverallPerformanceTabBtn' || tabButtonId === 'nonParticipatingBranchesTabBtn') { // Updated to include new tab
            reportsSection.style.display = 'block';
            document.querySelector('.controls-panel').style.display = 'flex'; // Controls panel visible for report tabs
            if (tabButtonId === 'allBranchSnapshotTabBtn') {
                renderAllBranchSnapshot();
            } else if (tabButtonId === 'allStaffOverallPerformanceTabBtn') {
                renderOverallStaffPerformanceReport();
            } else if (tabButtonId === 'nonParticipatingBranchesTabBtn') { // NEW
                renderNonParticipatingBranches(); // NEW
                document.querySelector('.controls-panel').style.display = 'none'; // Hide controls for this specific tab
            }
        } else if (tabButtonId === 'employeeManagementTabBtn') {
            employeeManagementSection.style.display = 'block';
            document.querySelector('.controls-panel').style.display = 'none'; // Hide controls for employee management
            displayEmployeeManagementMessage('', false);
        }
    }


    // Event listeners for main tab buttons
    if (allBranchSnapshotTabBtn) {
        allBranchSnapshotTabBtn.addEventListener('click', () => showTab('allBranchSnapshotTabBtn'));
    }
    if (allStaffOverallPerformanceTabBtn) {
        allStaffOverallPerformanceTabBtn.addEventListener('click', () => showTab('allStaffOverallPerformanceTabBtn'));
    }
    if (nonParticipatingBranchesTabBtn) { // NEW
        nonParticipatingBranchesTabBtn.addEventListener('click', () => showTab('nonParticipatingBranchesTabBtn')); // NEW
    }
    if (employeeManagementTabBtn) {
        employeeManagementTabBtn.addEventListener('click', () => showTab('employeeManagementTabBtn'));
    }

    // Event Listener for Add Employee Form
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const employeeName = newEmployeeNameInput.value.trim();
            const employeeCode = newEmployeeCodeInput.value.trim();
            const branchName = newBranchNameInput.value.trim();
            const designation = newDesignationInput.value.trim();

            if (!employeeName || !employeeCode || !branchName) {
                displayEmployeeManagementMessage('Please fill in Employee Name, Code, and Branch Name.', true);
                return;
            }

            const employeeData = {
                [HEADER_EMPLOYEE_NAME]: employeeName,
                [HEADER_EMPLOYEE_CODE]: employeeCode,
                [HEADER_BRANCH_NAME]: branchName,
                [HEADER_DESIGNATION]: designation
            };

            const success = await sendDataToGoogleAppsScript('add_employee', employeeData);

            if (success) {
                addEmployeeForm.reset();
            }
        });
    }

    // Event Listener for Bulk Add Employee Form
    if (bulkAddEmployeeForm) {
        bulkAddEmployeeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const branchName = bulkEmployeeBranchNameInput.value.trim();
            const bulkDetails = bulkEmployeeDetailsTextarea.value.trim();

            if (!branchName || !bulkDetails) {
                displayEmployeeManagementMessage('Branch Name and Employee Details are required for bulk entry.', true);
                return;
            }

            const employeeLines = bulkDetails.split('\n').filter(line => line.trim() !== '');
            const employeesToAdd = [];

            for (const line of employeeLines) {
                const parts = line.split(',').map(part => part.trim());
                if (parts.length < 2) {
                    displayEmployeeManagementMessage(`Skipping invalid line: "${line}". Each line must have at least Employee Name and Employee Code.`, true);
                    continue;
                }

                const employeeData = {
                    [HEADER_EMPLOYEE_NAME]: parts[0],
                    [HEADER_EMPLOYEE_CODE]: parts[1],
                    [HEADER_BRANCH_NAME]: branchName,
                    [HEADER_DESIGNATION]: parts[2] || ''
                };
                employeesToAdd.push(employeeData);
            }

            if (employeesToAdd.length > 0) {
                const success = await sendDataToGoogleAppsScript('add_bulk_employees', employeesToAdd);
                if (success) {
                    bulkAddEmployeeForm.reset();
                }
            } else {
                displayEmployeeManagementMessage('No valid employee entries found in the bulk details.', true);
            }
        });
    }

    // Event Listener for Delete Employee Form
    if (deleteEmployeeForm) {
        deleteEmployeeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const employeeCodeToDelete = deleteEmployeeCodeInput.value.trim();

            if (!employeeCodeToDelete) {
                displayEmployeeManagementMessage('Employee Code is required for deletion.', true);
                return;
            }

            const deleteData = { [HEADER_EMPLOYEE_CODE]: employeeCodeToDelete };
            const success = await sendDataToGoogleAppsScript('delete_employee', deleteData);

            if (success) {
                deleteEmployeeForm.reset();
            }
        });
    }

    // Initial data fetch and tab display when the page loads
    processData();
    showTab('allBranchSnapshotTabBtn');
});
