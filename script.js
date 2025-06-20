document.addEventListener('DOMContentLoaded', () => {

    // --- START: TWO-TIERED FRONT-END PASSWORD PROTECTION ---
    const ACCESS_PASSWORD_FULL = "sml4576"; // Full access password
    const ACCESS_PASSWORD_LIMITED = "123";  // Limited access password
    let currentAccessLevel = null; // To store 'full' or 'limited'
    const accessDeniedOverlay = document.getElementById('accessDeniedOverlay');
    const dashboardContent = document.getElementById('dashboardContent');
    const secretPasswordInputContainer = document.getElementById('secretPasswordInputContainer');
    const secretPasswordInput = document.getElementById('secretPasswordInput');
    const submitSecretPasswordBtn = document.getElementById('submitSecretPassword');
    const passwordErrorMessage = document.getElementById('passwordErrorMessage');
   // Get references to buttons/tabs that need conditional access
    const downloadOverallStaffPerformanceReportBtn = document.getElementById('downloadOverallStaffPerformanceReportBtn');
    const detailedCustomerViewTabBtn = document.getElementById('detailedCustomerViewTabBtn');
    const viewAllEntriesButton = document.getElementById('viewAllEntriesBtn'); // <--- ADD THIS LINE (OR UPDATE THE EXISTING PLACEHOLDER)
       if (secretPasswordInput) {
        secretPasswordInput.focus();
    }
    submitSecretPasswordBtn.addEventListener('click', () => {
        checkAndSetAccess();
    });
    secretPasswordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkAndSetAccess();
        }
    });

    function checkAndSetAccess() {
        const enteredPassword = secretPasswordInput.value;

        if (enteredPassword === ACCESS_PASSWORD_FULL) {
            currentAccessLevel = 'full';
            grantAccess();
        } else if (enteredPassword === ACCESS_PASSWORD_LIMITED) {
            currentAccessLevel = 'limited';
            grantAccess();
        } else {
            passwordErrorMessage.textContent = "Incorrect password. Try again.";
            passwordErrorMessage.style.display = 'block';
            secretPasswordInput.value = '';
            secretPasswordInput.focus();
        }
    }

   function grantAccess() {
    console.log("grantAccess function called!"); // Add this line
    accessDeniedOverlay.style.display = 'none'; // Hide overlay
    console.log("Access overlay hidden."); // Add this line

    console.log("Value of dashboardContent:", dashboardContent); // Add this line
    if (dashboardContent) { // Add this if statement
        dashboardContent.style.display = 'block';   // Show dashboard content
        console.log("Dashboard content display set to block."); // Add this line
    } else {
        console.error("Error: dashboardContent element not found!"); // Add this line
    }

    // Apply access restrictions based on currentAccessLevel
    applyAccessRestrictions();
    // Now, call your main processing function that starts everything
    processData(); // This fetches your data
    // Set initial tab based on access level
    if (currentAccessLevel === 'limited') {
        showTab('allBranchSnapshotTabBtn');
    } else {
        // Full access users get the default initial tab
        showTab('allBranchSnapshotTabBtn');
    }
}

    function applyAccessRestrictions() {
        if (currentAccessLevel === 'limited') {
            // Hide "Download Overall Performance" button
            if (downloadOverallStaffPerformanceReportBtn) {
                downloadOverallStaffPerformanceReportBtn.style.display = 'none';
            }
            // Hide "Detailed Customer View" tab
            if (detailedCustomerViewTabBtn) {
                detailedCustomerViewTabBtn.style.display = 'none';
            }
            // Hide "View all entries" button
            if (viewAllEntriesButton) { // <--- ADD THIS BLOCK
                viewAllEntriesButton.style.display = 'none';
            }
        } else if (currentAccessLevel === 'full') {
            // Ensure all are visible for full access
            if (downloadOverallStaffPerformanceReportBtn) {
                downloadOverallStaffPerformanceReportBtn.style.display = 'inline-block'; // Or 'block', depending on your CSS
            }
            if (detailedCustomerViewTabBtn) {
                detailedCustomerViewTabBtn.style.display = 'inline-block'; // Or 'block'
            }
            if (viewAllEntriesButton) { // <--- ADD THIS BLOCK
                viewAllEntriesButton.style.display = 'inline-block'; // Or 'block'
            }
        }
    }
   
// This URL is for your Canvassing Data sheet. Ensure it's correct and published as CSV.
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTO7LujC4VSa2wGkJ2YEYSN7UeXR221ny3THaVegYfNfRm2JQGg7QR9Bxxh9SadXtK8Pi6-psl2tGsb/pub?gid=696550092&single=true&output=csv"; 
// IMPORTANT: Replace this with YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxe_hZyRXZdY1CbfchvH_pzIa596dxmEDnPVc4YGXWerxRmuJz30CpEbND279mR0lWf/exec"; // <-- PASTE YOUR NEWLY DEPLOYED WEB APP URL HERE
// For front-end reporting, all employee and branch data will come from Canvassing Data and predefined list.
   // const EMPLOYEE_MASTER_DATA_URL = "UNUSED"; // Marked as UNUSED for clarity, won't be fetched for reports

    const MONTHLY_WORKING_DAYS = 22; // Common approximation for a month's working days

    const TARGETS = {
        'Branch Manager': {
            'Visit': 10,
            'Call': 3 * MONTHLY_WORKING_DAYS,
            'Reference': 1 * MONTHLY_WORKING_DAYS,
            'New Customer Leads': 20
        },
        'Investment Staff': { // Added Investment Staff with custom Visit target
            'Visit': 15,
            'Call': 3 * MONTHLY_WORKING_DAYS,
            'Reference': 1 * MONTHLY_WORKING_DAYS,
            'New Customer Leads': 20
        },
        'Seniors': { // Added Investment Staff with custom Visit target
            'Visit': 15,
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
    // Predefined list of branches for the dropdown and "no participation" check
    const PREDEFINED_BRANCHES = [
        "Angamaly", "Corporate Office", "Edappally", "Harippad", "Koduvayur", "Kuzhalmannam",
        "Mattanchery", "Mavelikara", "Nedumkandom", "Nenmara", "Paravoor", "Perumbavoor",
        "Thiruwillamala", "Thodupuzha", "Chengannur", "Alathur", "Kottayam", "Kattapana",
        "Muvattupuzha", "Thiruvalla", "Pathanamthitta", "Kunnamkulam", "HO KKM" // Corrected "Pathanamthitta" typo if it existed previously
    ].sort();

    // --- Column Headers Mapping (IMPORTANT: These must EXACTLY match the column names in your "Form Responses 2" Google Sheet) ---
    const HEADER_TIMESTAMP = 'Timestamp';
    const HEADER_DATE = 'Date';
    const HEADER_BRANCH_NAME = 'Branch Name';
    const HEADER_EMPLOYEE_NAME = 'Employee Name';
    const HEADER_EMPLOYEE_CODE = 'Employee Code';
    const HEADER_DESIGNATION = 'Designation';
    const HEADER_ACTIVITY_TYPE = 'Activity Type';
    const HEADER_TYPE_OF_CUSTOMER = 'Type of Customer'; // !!! CORRECTED TYPO HERE !!!
    const HEADER_R_LEAD_SOURCE = 'rLead Source';      // Keeping user's provided interpretation of split header
    const HEADER_HOW_CONTACTED = 'How Contacted'; // This is not in the list provided by user, but is in the original script. Keeping it.
    const HEADER_PROSPECT_NAME = 'Prospect Name';
    const HEADER_PHONE_NUMBER_WHATSAPP = 'Phone Numebr(Whatsapp)'; // Keeping user's provided typo
    const HEADER_ADDRESS = 'Address';
    const HEADER_PROFESSION = 'Profession';
    const HEADER_DOB_WD = 'DOB/WD';
    const HEADER_PRODUCT_INTERESTED = 'Prodcut Interested'; // Keeping user's provided typo
    const HEADER_REMARKS = 'Remarks';
    const HEADER_NEXT_FOLLOW_UP_DATE = 'Next Follow-up Date';
    const HEADER_RELATION_WITH_STAFF = 'Relation With Staff';
    // NEW: Customer Detail Headers as provided by user
    const HEADER_FAMILY_DETAILS_1 = 'Family Deatils -1 Name of wife/Husband';
    const HEADER_FAMILY_DETAILS_2 = 'Family Deatils -2 Job of wife/Husband';
    const HEADER_FAMILY_DETAILS_3 = 'Family Deatils -3 Names of Children';
    const HEADER_FAMILY_DETAILS_4 = 'Family Deatils -4 Deatils of Children';
    const HEADER_PROFILE_OF_CUSTOMER = 'Profile of Customer';


    // Core Display and Status Elements
    const reportDisplay = document.getElementById('reportDisplay');
    const statusMessage = document.getElementById('statusMessage');

    // Main Content Sections to toggle
    const reportsSection = document.getElementById('reportsSection');
    const detailedCustomerViewSection = document.getElementById('detailedCustomerViewSection');
    const employeeManagementSection = document.getElementById('employeeManagementSection');

    // Tab buttons for main navigation
    const allBranchSnapshotTabBtn = document.getElementById('allBranchSnapshotTabBtn');
    const allStaffOverallPerformanceTabBtn = document.getElementById('allStaffOverallPerformanceTabBtn');
    const nonParticipatingBranchesTabBtn = document.getElementById('nonParticipatingBranchesTabBtn');
    const branchPerformanceTabBtn = document.getElementById('branchPerformanceTabBtn');
   // const  = document.getElementById('detailedCustomerViewTabBtn');
    const employeeManagementTabBtn = document.getElementById('employeeManagementTabBtn');

    // Dropdowns & Filter Panels
    const branchSelect = document.getElementById('branchSelect');
    const employeeSelect = document.getElementById('employeeSelect');
    const employeeFilterPanel = document.getElementById('employeeFilterPanel'); // New from your list
    const customerViewBranchSelect = document.getElementById('customerViewBranchSelect');
    const customerViewEmployeeSelect = document.getElementById('customerViewEmployeeSelect');

    // View Option Buttons (from your provided list)
    const viewOptions = document.getElementById('viewOptions');
    const viewBranchPerformanceReportBtn = document.getElementById('viewBranchPerformanceReportBtn');
    const viewEmployeeSummaryBtn = document.getElementById('viewEmployeeSummaryBtn');
    const viewAllEntriesBtn = document.getElementById('viewAllEntriesBtn');
    const viewPerformanceReportBtn = document.getElementById('viewPerformanceReportBtn');
    const viewBranchVisitLeaderboardBtn = document.getElementById('viewBranchVisitLeaderboardBtn');
    const viewBranchCallLeaderboardBtn = document.getElementById('viewBranchCallLeaderboardBtn');
    const viewStaffParticipationBtn = document.getElementById('viewStaffParticipationBtn');

    // Detailed Customer View Specific Elements
    const customerCanvassedList = document.getElementById('customerCanvassedList');
    const customerDetailsContent = document.getElementById('customerDetailsContent');
    const customerCard1 = document.getElementById('customerCard1');
    const customerCard2 = document.getElementById('customerCard2');
    const customerCard3 = document.getElementById('customerCard3');
    const detailedCustomerReportTableBody = document.getElementById('detailedCustomerReportTableBody');

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

    // Download Buttons
    const downloadDetailedCustomerReportBtn = document.getElementById('downloadDetailedCustomerReportBtn');
    // const downloadOverallStaffPerformanceReportBtn = document.getElementById('downloadOverallStaffPerformanceReportBtn'); 
    
    // Global variables to store fetched data
    let allCanvassingData = []; // Raw activity data from Form Responses 2
    let allUniqueBranches = []; // Will be populated from PREDEFINED_BRANCHES
    let allUniqueEmployees = []; // Employee codes from Canvassing Data
    let employeeCodeToNameMap = {}; // {code: name} from Canvassing Data
    let employeeCodeToDesignationMap = {}; // {code: designation} from Canvassing Data
    let selectedBranchEntries = []; // Activity entries filtered by branch (for main reports section)
    let selectedEmployeeCodeEntries = []; // Activity entries filtered by employee code (for main reports section)


    // Utility to format date to ISO-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toISOString().split('T')[0];
    };

    // Helper to clear and display messages in a specific div (now targets statusMessageDiv)
    // Helper to clear and display messages in a specific div
function displayMessage(message, type = 'info') {
    // Corrected: Use 'statusMessage' which is declared at the top of DOMContentLoaded
    if (statusMessage) { // Ensure the element exists
        statusMessage.innerHTML = `<div class="message ${type}">${message}</div>`;
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.innerHTML = ''; // Clear message
            statusMessage.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    } else {
        console.error("Error: 'statusMessage' element not found in the DOM.");
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
            // Use the name from the map if available, otherwise use the code for sorting and display
            const nameA = employeeCodeToNameMap[codeA] || codeA;
            const nameB = employeeCodeToNameMap[codeB] || codeB;
            return nameA.localeCompare(nameB);
        });

        populateDropdown(branchSelect, allUniqueBranches); // Populate branch dropdown with predefined branches
        populateDropdown(customerViewBranchSelect, allUniqueBranches); // Populate branch dropdown for detailed customer view
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

            // Deactivate all buttons in viewOptions and then reactivate the appropriate ones
            document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));

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
            
            // Automatically trigger the Employee Summary (d4.PNG style)
            document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
            viewEmployeeSummaryBtn.classList.add('active'); // Set Employee Summary as active
            renderEmployeeSummary(selectedEmployeeCodeEntries); // Render the Employee Summary
            
        } else {
            selectedEmployeeCodeEntries = []; // Clear previous activity filter
            reportDisplay.innerHTML = '<p>Select an employee or choose a report option.S</p>';
            // Clear active button if employee selection is cleared
            document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
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
            // if the 'Type of Customer' (now correctly spelled) is simply 'new', regardless of 'Activity Type'.
            if (trimmedTypeOfCustomer === 'new') {
                totalActivity['New Customer Leads']++;
                console.log(`  New Customer Lead INCREMENTED based on Type of Customer === 'new'.`);
            } else {
                console.log(`  New Customer Lead NOT INCREMENTED: Type of Customer is not 'new'.`);
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

   
    // NEW: Render Non-Participating Branches Report (now Zero Visit Branches)
    function renderNonParticipatingBranches() {
        reportDisplay.innerHTML = '<h2>Zero Visit Branches</h2>'; // Changed title
        const zeroVisitBranches = [];

        PREDEFINED_BRANCHES.forEach(branch => {
            const branchActivityEntries = allCanvassingData.filter(entry => entry[HEADER_BRANCH_NAME] === branch);
            const { totalActivity } = calculateTotalActivity(branchActivityEntries); // Get total activities

            // Check if total visits for this branch is 0
            if (totalActivity['Visit'] === 0) {
                zeroVisitBranches.push(branch);
            }
        });

        if (zeroVisitBranches.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'non-participating-branch-list'; // Reusing existing class
            zeroVisitBranches.forEach(branch => {
                const li = document.createElement('li');
                li.textContent = branch;
                ul.appendChild(li);
            });
            reportDisplay.appendChild(ul);
        } else {
            reportDisplay.innerHTML += '<p class="no-participation-message">All predefined branches have recorded visits!</p>'; // Changed message
        }
    }

    // Render All Staff Overall Performance Report (for d1.PNG)
    function renderOverallStaffPerformanceReport() {
        reportDisplay.innerHTML = '<h2>Overall Staff Performance Report (This Month)</h2>';
        const tableContainer = document.createElement('div');
        tableContainer.className = 'data-table-container'; // For horizontal scrolling
        
        const table = document.createElement('table');
        table.className = 'performance-table';
        
        const thead = table.createTHead();
        let headerRow = thead.insertRow();
        
        // Main Headers
        headerRow.insertCell().textContent = 'Employee Name';
        headerRow.insertCell().textContent = 'Branch Name';
        headerRow.insertCell().textContent = 'Designation';
        
        // Define metrics for the performance table
        const metrics = ['Visit', 'Call', 'Reference', 'New Customer Leads'];
        
        metrics.forEach(metric => {
            const th = document.createElement('th');
            th.colSpan = 3; // 'Actual', 'Target', '%'
            th.textContent = metric;
            headerRow.appendChild(th);
        });

        // Sub-headers
        headerRow = thead.insertRow(); // New row for sub-headers
        headerRow.insertCell(); // Empty cell for Employee Name
        headerRow.insertCell(); // Empty cell for Branch Name
        headerRow.insertCell(); // Empty cell for Designation
        metrics.forEach(() => {
            ['Act', 'Tgt', '%'].forEach(subHeader => {
                const th = document.createElement('th');
                th.textContent = subHeader;
                headerRow.appendChild(th);
            });
        });

        const tbody = table.createTBody();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Get unique employees who have made at least one entry this month
        const employeesWithActivityThisMonth = [...new Set(allCanvassingData
            .filter(entry => {
                const entryDate = new Date(entry[HEADER_TIMESTAMP]);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            })
            .map(entry => entry[HEADER_EMPLOYEE_CODE]))].sort((codeA, codeB) => {
                const nameA = employeeCodeToNameMap[codeA] || codeA;
                const nameB = employeeCodeToNameMap[codeB] || codeB;
                return nameA.localeCompare(nameB);
            });


        if (employeesWithActivityThisMonth.length === 0) {
            reportDisplay.innerHTML += '<p>No employee activity found for the current month.</p>';
            return;
        }

        employeesWithActivityThisMonth.forEach(employeeCode => {
            const employeeName = employeeCodeToNameMap[employeeCode] || employeeCode;
            const branchName = allCanvassingData.find(entry => entry[HEADER_EMPLOYEE_CODE] === employeeCode)?.[HEADER_BRANCH_NAME] || 'N/A';
            const designation = employeeCodeToDesignationMap[employeeCode] || 'Default';

            const employeeActivities = allCanvassingData.filter(entry =>
                entry[HEADER_EMPLOYEE_CODE] === employeeCode &&
                new Date(entry[HEADER_TIMESTAMP]).getMonth() === currentMonth &&
                new Date(entry[HEADER_TIMESTAMP]).getFullYear() === currentYear
            );
            const { totalActivity } = calculateTotalActivity(employeeActivities);
            
            const targets = TARGETS[designation] || TARGETS['Default'];
            const performance = calculatePerformance(totalActivity, targets);

            const row = tbody.insertRow();
            row.insertCell().textContent = employeeName;
            row.insertCell().textContent = branchName;
            row.insertCell().textContent = designation;

            metrics.forEach(metric => {
                const actualValue = totalActivity[metric] || 0;
                const targetValue = targets[metric] || 0; // Ensure target is 0 if undefined
                let percentValue = performance[metric];
                let displayPercent;
                let progressBarClass;
                let progressWidth;

                if (isNaN(percentValue) || targetValue === 0) { // If target is 0, it's N/A
                    displayPercent = 'N/A';
                    progressWidth = 0;
                    progressBarClass = 'no-activity';
                } else {
                    displayPercent = `${Math.round(percentValue)}%`;
                    progressWidth = Math.min(100, Math.round(percentValue));
                    progressBarClass = getProgressBarClass(percentValue);
                }
                // Special handling for 0 actuals with positive targets to show 0% and danger color
                if (actualValue === 0 && targetValue > 0) {
                    displayPercent = '0%';
                    progressWidth = 0;
                    progressBarClass = 'danger';
                }

                row.insertCell().textContent = actualValue;
                row.insertCell().textContent = targetValue;
                const percentCell = row.insertCell();
                percentCell.innerHTML = `
                    <div class="progress-bar-container-small">
                        <div class="progress-bar ${progressBarClass}" style="width: ${progressWidth === 0 && displayPercent !== 'N/A' ? '30px' : progressWidth}%">
                            ${displayPercent}
                        </div>
                    </div>
                `;
            });
        });
        tableContainer.appendChild(table);
        reportDisplay.appendChild(tableContainer);
    }
    // --- NEW: Function to generate and download the Overall Staff Performance Report as CSV ---
    function downloadOverallStaffPerformanceReportCSV() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Get all employees who have had activity this month
        const employeesWithActivityThisMonth = [...new Set(allCanvassingData
            .filter(entry => {
                const entryDate = new Date(entry[HEADER_TIMESTAMP]);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            })
            .map(entry => entry[HEADER_EMPLOYEE_CODE]))].sort((codeA, codeB) => {
                const nameA = employeeCodeToNameMap[codeA] || codeA;
                const nameB = employeeCodeToNameMap[codeB] || codeB;
                return nameA.localeCompare(nameB);
            });

        if (employeesWithActivityThisMonth.length === 0) {
            displayMessage("No employee activity found for the current month to download.", 'info');
            return;
        }

        // Define metrics for the performance table
        const metrics = ['Visit', 'Call', 'Reference', 'New Customer Leads'];
        const csvRows = [];

        // Add main headers
        let headers = ['Employee Name', 'Branch Name', 'Employee Code'];
        metrics.forEach(metric => {
            headers.push(`${metric} Actual`, `${metric} Target`, `${metric} %`);
        });
        csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')); // Quote headers

        employeesWithActivityThisMonth.forEach(employeeCode => {
            const employeeName = employeeCodeToNameMap[employeeCode] || employeeCode;
            const branchName = allCanvassingData.find(entry => entry[HEADER_EMPLOYEE_CODE] === employeeCode)?.[HEADER_BRANCH_NAME] || 'N/A';
            const designation = employeeCodeToDesignationMap[employeeCode] || 'Default';

            const employeeActivities = allCanvassingData.filter(entry =>
                entry[HEADER_EMPLOYEE_CODE] === employeeCode &&
                new Date(entry[HEADER_TIMESTAMP]).getMonth() === currentMonth &&
                new Date(entry[HEADER_TIMESTAMP]).getFullYear() === currentYear
            );
            const { totalActivity } = calculateTotalActivity(employeeActivities); // Use existing calculation
            
            const targets = TARGETS[designation] || TARGETS['Default']; // Use existing targets
            const performance = calculatePerformance(totalActivity, targets); // Use existing performance calculation

            let rowData = [employeeName, branchName, employeeCode];
            metrics.forEach(metric => {
                const actualValue = totalActivity[metric] || 0;
                const targetValue = targets[metric] || 0;
                let percentValue = performance[metric];
                let displayPercent;

                if (isNaN(percentValue) || targetValue === 0) {
                    displayPercent = 'N/A';
                } else {
                    displayPercent = `${Math.round(percentValue)}%`;
                }
                if (actualValue === 0 && targetValue > 0) {
                    displayPercent = '0%';
                }
                rowData.push(actualValue, targetValue, displayPercent);
            });
            csvRows.push(rowData.map(cell => {
                // Ensure values are properly quoted if they contain commas or quotes
                const stringCell = String(cell);
                return `"${stringCell.replace(/"/g, '""')}"`;
            }).join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'Overall_Staff_Performance_Report.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            displayMessage("Overall Staff Performance Report downloaded successfully!", 'success');
        } else {
            // Fallback for browsers that don't support download attribute
            displayMessage("Your browser does not support automatic downloads. Please copy the data manually.", 'error');
            // Optionally display the CSV data for manual copying
            console.log(csvString);
        }
    }
    // --- END NEW ---
    // Function to calculate performance percentage
    function calculatePerformance(actuals, targets) {
        const performance = {};
        for (const metric in targets) {
            const actual = actuals[metric] || 0;
            const target = targets[metric];
            if (target > 0) {
                performance[metric] = (actual / target) * 100;
            } else {
                performance[metric] = NaN; // Or 0, depending on how you want to handle no target
            }
        }
        return performance;
    }

    // Helper to determine progress bar class based on percentage
    function getProgressBarClass(percentage) {
        if (percentage >= 100) return 'success';
        if (percentage >= 75) return 'warning-high';
        if (percentage >= 50) return 'warning-medium';
        if (percentage > 0) return 'warning-low';
        return 'danger';
    }


    // Function to render Branch Performance Report (d3.PNG)
    function renderBranchPerformanceReport(branchName) {
        reportDisplay.innerHTML = `<h2>Branch Performance Report: ${branchName} (This Month)</h2>`;

        const branchActivityEntries = allCanvassingData.filter(entry => entry[HEADER_BRANCH_NAME] === branchName);

        if (branchActivityEntries.length === 0) {
            reportDisplay.innerHTML += '<p>No activity found for this branch this month.</p>';
            return;
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const employeesInBranch = [...new Set(branchActivityEntries
            .filter(entry => {
                const entryDate = new Date(entry[HEADER_TIMESTAMP]);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            })
            .map(entry => entry[HEADER_EMPLOYEE_CODE]))].sort((codeA, codeB) => {
                const nameA = employeeCodeToNameMap[codeA] || codeA;
                const nameB = employeeCodeToNameMap[codeB] || codeB;
                return nameA.localeCompare(nameB);
            });

        if (employeesInBranch.length === 0) {
            reportDisplay.innerHTML += '<p>No employee activity found for this branch for the current month.</p>';
            return;
        }

        const branchPerformanceGrid = document.createElement('div');
        branchPerformanceGrid.className = 'branch-performance-grid';

        employeesInBranch.forEach(employeeCode => {
            const employeeActivities = branchActivityEntries.filter(entry => entry[HEADER_EMPLOYEE_CODE] === employeeCode);
            const { totalActivity } = calculateTotalActivity(employeeActivities); // Destructure
            const employeeDisplayName = employeeCodeToNameMap[employeeCode] || employeeCode; // Use name from map or code
            const designation = employeeCodeToDesignationMap[employeeCode] || 'Default';
            
            const targets = TARGETS[designation] || TARGETS['Default'];
            const performance = calculatePerformance(totalActivity, targets);

            const employeeCard = document.createElement('div');
            employeeCard.className = 'employee-performance-card';
            employeeCard.innerHTML = `
                <h4>${employeeDisplayName} (${designation})</h4>
                <div style="overflow-x: auto;"> <table class="performance-table">
                        <thead>
                            <tr><th>Metric</th><th>Actual</th><th>Target</th><th>%</th></tr>
                        </thead>
                        <tbody>
                            ${Object.keys(targets).map(metric => {
                                const actualValue = totalActivity[metric] || 0;
                                const targetValue = targets[metric];
                                let percentValue = performance[metric]; // Raw numerical percentage
                                let displayPercent;
                                let progressWidth;
                                let progressBarClass;

                                if (isNaN(percentValue) || targetValue === 0) { // Check for NaN or if target is 0
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
                                        <td data-label="Achievement (%)">${displayPercent}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            branchPerformanceGrid.appendChild(employeeCard);
        });
        reportDisplay.appendChild(branchPerformanceGrid);
    }
    // --- NEW: Function to generate and download the Overall Staff Performance Report as CSV ---
    function downloadOverallStaffPerformanceReportCSV() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Get all employees who have had activity this month
        const employeesWithActivityThisMonth = [...new Set(allCanvassingData
            .filter(entry => {
                const entryDate = new Date(entry[HEADER_TIMESTAMP]);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            })
            .map(entry => entry[HEADER_EMPLOYEE_CODE]))].sort((codeA, codeB) => {
                const nameA = employeeCodeToNameMap[codeA] || codeA;
                const nameB = employeeCodeToNameMap[codeB] || codeB;
                return nameA.localeCompare(nameB);
            });

        if (employeesWithActivityThisMonth.length === 0) {
            displayMessage("No employee activity found for the current month to download.", 'info');
            return;
        }

        // Define metrics for the performance table
        const metrics = ['Visit', 'Call', 'Reference', 'New Customer Leads'];
        const csvRows = [];

        // Add main headers
        let headers = ['Employee Name', 'Branch Name', 'Employee Code'];
        metrics.forEach(metric => {
            headers.push(`${metric} Actual`, `${metric} Target`, `${metric} %`);
        });
        csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')); // Quote headers

        employeesWithActivityThisMonth.forEach(employeeCode => {
            const employeeName = employeeCodeToNameMap[employeeCode] || employeeCode;
            const branchName = allCanvassingData.find(entry => entry[HEADER_EMPLOYEE_CODE] === employeeCode)?.[HEADER_BRANCH_NAME] || 'N/A';
            const designation = employeeCodeToDesignationMap[employeeCode] || 'Default';

            const employeeActivities = allCanvassingData.filter(entry =>
                entry[HEADER_EMPLOYEE_CODE] === employeeCode &&
                new Date(entry[HEADER_TIMESTAMP]).getMonth() === currentMonth &&
                new Date(entry[HEADER_TIMESTAMP]).getFullYear() === currentYear
            );
            const { totalActivity } = calculateTotalActivity(employeeActivities); // Use existing calculation
            
            const targets = TARGETS[designation] || TARGETS['Default']; // Use existing targets
            const performance = calculatePerformance(totalActivity, targets); // Use existing performance calculation

            let rowData = [employeeName, branchName, employeeCode];
            metrics.forEach(metric => {
                const actualValue = totalActivity[metric] || 0;
                const targetValue = targets[metric] || 0;
                let percentValue = performance[metric];
                let displayPercent;

                if (isNaN(percentValue) || targetValue === 0) {
                    displayPercent = 'N/A';
                } else {
                    displayPercent = `${Math.round(percentValue)}%`;
                }
                if (actualValue === 0 && targetValue > 0) {
                    displayPercent = '0%';
                }
                rowData.push(actualValue, targetValue, displayPercent);
            });
            csvRows.push(rowData.map(cell => {
                // Ensure values are properly quoted if they contain commas or quotes
                const stringCell = String(cell);
                return `"${stringCell.replace(/"/g, '""')}"`;
            }).join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'Overall_Staff_Performance_Report.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            displayMessage("Overall Staff Performance Report downloaded successfully!", 'success');
        } else {
            // Fallback for browsers that don't support download attribute
            displayMessage("Your browser does not support automatic downloads. Please copy the data manually.", 'error');
            // Optionally display the CSV data for manual copying
            console.log(csvString);
        }
    }
    // --- END NEW ---

    // Render Employee Summary (Current Month) - d4.PNG layout
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

        reportDisplay.innerHTML = `<h2>Activity Summary for ${employeeDisplayName}</h2>
                                    <p><strong>Total Canvassing Entries (This Month):</strong> ${currentMonthEntries.length}</p>`; // Added total entries from d4.PNG

        const summaryBreakdownCard = document.createElement('div');
        summaryBreakdownCard.className = 'summary-breakdown-card'; // New class for this grid layout

        // Key Activity Counts
        const keyActivityDiv = document.createElement('div');
        keyActivityDiv.innerHTML = `
            <h4>Key Activity Counts:</h4>
            <ul class="summary-list">
                <li><strong>Visits:</strong> ${totalActivity['Visit']}</li>
                <li><strong>Calls:</strong> ${totalActivity['Call']}</li>
                <li><strong>References:</strong> ${totalActivity['Reference']}</li>
                <li><strong>New Customer Leads:</strong> ${totalActivity['New Customer Leads']}</li>
            </ul>
        `;
        summaryBreakdownCard.appendChild(keyActivityDiv);

        // Activity Types Breakdown
        const activityTypesDiv = document.createElement('div');
        const activityTypeCounts = {}; // Recalculate this specifically for current month entries
        currentMonthEntries.forEach(entry => {
            const type = entry[HEADER_ACTIVITY_TYPE] || 'Unknown';
            activityTypeCounts[type] = (activityTypeCounts[type] || 0) + 1;
        });

        const activityTypeList = Object.keys(activityTypeCounts).map(type => `<li><strong>${type}:</strong> ${activityTypeCounts[type]}</li>`).join('');
        activityTypesDiv.innerHTML = `
            <h4>Activity Types Breakdown:</h4>
            <ul class="summary-list">
                ${activityTypeList || '<li>No activities recorded.</li>'}
            </ul>
        `;
        summaryBreakdownCard.appendChild(activityTypesDiv);

        // Product Interested Breakdown
        const productInterestDiv = document.createElement('div');
        const productInterestListItems = productInterests.map(product => `<li>${product}</li>`).join('');
        productInterestDiv.innerHTML = `
            <h4>Product Interested:</h4>
            <ul class="product-interest-list">
                ${productInterestListItems || '<li>No products recorded.</li>'}
            </ul>
        `;
        summaryBreakdownCard.appendChild(productInterestDiv);

        // Lead Source Breakdown
        const leadSourceDiv = document.createElement('div');
        const leadSourceCounts = {};
        currentMonthEntries.forEach(entry => {
            const source = entry[HEADER_R_LEAD_SOURCE] || 'Unknown';
            leadSourceCounts[source] = (leadSourceCounts[source] || 0) + 1;
        });
        const leadSourceList = Object.keys(leadSourceCounts).map(source => `<li><strong>${source}:</strong> ${leadSourceCounts[source]}</li>`).join('');
        leadSourceDiv.innerHTML = `
            <h4>Lead Sources:</h4>
            <ul class="summary-list">
                ${leadSourceList || '<li>No lead sources recorded.</li>'}
            </ul>
        `;
        summaryBreakdownCard.appendChild(leadSourceDiv);

        reportDisplay.appendChild(summaryBreakdownCard);
    }

    // Render Employee Performance Report (similar to d3.PNG for a single employee)
    function renderEmployeePerformanceReport(employeeCodeEntries) {
        if (employeeCodeEntries.length === 0) {
            reportDisplay.innerHTML = '<p>No activity data for this employee for the selected period.</p>';
            return;
        }

        const employeeDisplayName = employeeCodeToNameMap[employeeCodeEntries[0][HEADER_EMPLOYEE_CODE]] || employeeCodeEntries[0][HEADER_EMPLOYEE_CODE];
        const employeeCode = employeeCodeEntries[0][HEADER_EMPLOYEE_CODE];
        const designation = employeeCodeToDesignationMap[employeeCode] || 'Default';

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentMonthEntries = employeeCodeEntries.filter(entry => {
            const entryDate = new Date(entry[HEADER_TIMESTAMP]);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        });

        const { totalActivity } = calculateTotalActivity(currentMonthEntries); // Get just totalActivity

        reportDisplay.innerHTML = `<h2>Employee Performance Report: ${employeeDisplayName} (${designation}) - This Month</h2>`;

        const targets = TARGETS[designation] || TARGETS['Default'];
        const performance = calculatePerformance(totalActivity, targets);

        const tableContainer = document.createElement('div');
        tableContainer.className = 'data-table-container'; // For horizontal scrolling
        
        const table = document.createElement('table');
        table.className = 'performance-table'; // Use the same performance table style

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Actual (This Month)</th>
                    <th>Target (Monthly)</th>
                    <th>Achievement (%)</th>
                    <th>Progress</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(targets).map(metric => {
                    const actualValue = totalActivity[metric] || 0;
                    const targetValue = targets[metric];
                    let percentValue = performance[metric]; // Raw numerical percentage
                    let displayPercent;
                    let progressWidth;
                    let progressBarClass;

                    if (isNaN(percentValue) || targetValue === 0) { // Check for NaN or if target is 0
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
                            <td data-label="Achievement (%)">${displayPercent}</td>
                            <td data-label="Progress">
                                <div class="progress-bar-container">
                                    <div class="progress-bar ${progressBarClass}" style="width: ${progressWidth === 0 && displayPercent !== 'N/A' ? '30px' : progressWidth}%">
                                        ${displayPercent}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        tableContainer.appendChild(table);
        reportDisplay.appendChild(tableContainer);
    }

    // Render Employee Detailed Entries (uses selectedEmployeeCodeEntries which are activity entries)
    function renderEmployeeDetailedEntries(employeeCodeEntries) {
        if (employeeCodeEntries.length === 0) {
            reportDisplay.innerHTML = '<p>No detailed activity entries for this employee code.</p>';
            return;
        }
        const employeeDisplayName = employeeCodeToNameMap[employeeCodeEntries[0][HEADER_EMPLOYEE_CODE]] || employeeCodeEntries[0][HEADER_EMPLOYEE_CODE];
        reportDisplay.innerHTML = `<h2>All Canvassing Entries for ${employeeDisplayName}</h2>`;

        const tableContainer = document.createElement('div');
        tableContainer.className = 'data-table-container'; // Enable horizontal scrolling for the table

        const table = document.createElement('table');
        table.className = 'detailed-entries-table'; // You might want to define this in style.css

        const thead = table.createTHead();
        const headerRow = thead.insertRow();

        // Dynamically create headers from the first entry, excluding 'Timestamp' and 'How Contacted' if desired
        // Or explicitly list them
        const displayHeaders = [
            HEADER_DATE, HEADER_BRANCH_NAME, HEADER_EMPLOYEE_NAME, HEADER_EMPLOYEE_CODE,
            HEADER_DESIGNATION, HEADER_ACTIVITY_TYPE, HEADER_TYPE_OF_CUSTOMER, HEADER_R_LEAD_SOURCE,
            HEADER_PROSPECT_NAME, HEADER_PHONE_NUMBER_WHATSAPP, HEADER_ADDRESS, HEADER_PROFESSION,
            HEADER_DOB_WD, HEADER_PRODUCT_INTERESTED, HEADER_REMARKS, HEADER_NEXT_FOLLOW_UP_DATE,
            HEADER_RELATION_WITH_STAFF, HEADER_FAMILY_DETAILS_1, HEADER_FAMILY_DETAILS_2,
            HEADER_FAMILY_DETAILS_3, HEADER_FAMILY_DETAILS_4, HEADER_PROFILE_OF_CUSTOMER
        ];

        displayHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        employeeCodeEntries.forEach(entry => {
            const row = tbody.insertRow();
            displayHeaders.forEach(header => {
                const cell = row.insertCell();
                cell.textContent = entry[header] || ''; // Use empty string if data is missing
                cell.setAttribute('data-label', header); // For responsive design
            });
        });

        tableContainer.appendChild(table);
        reportDisplay.appendChild(tableContainer);
    }// --- UPDATED: Branch Visit Leaderboard Report ---
    function renderBranchVisitLeaderboard() {
        reportDisplay.innerHTML = '<h2>Branch Visit Analysis</h2>';

        const branchVisitCounts = {};

        // Aggregate visits for each branch
        allCanvassingData.forEach(entry => {
            const branch = entry[HEADER_BRANCH_NAME];
            const activityType = entry[HEADER_ACTIVITY_TYPE] ? entry[HEADER_ACTIVITY_TYPE].trim().toLowerCase() : '';

            if (branch && activityType === 'visit') {
                branchVisitCounts[branch] = (branchVisitCounts[branch] || 0) + 1;
            }
        });

        // Initialize all predefined branches with 0 visits if they don't have any entries
        const allBranchesWithCounts = PREDEFINED_BRANCHES.map(branch => ({
            name: branch,
            visits: branchVisitCounts[branch] || 0
        }));


        if (allBranchesWithCounts.length === 0) {
            reportDisplay.innerHTML += '<p>No branch data available to generate this report.</p>';
            return;
        }

        // Sort for Max Visits (descending)
        const sortedByVisitsDesc = [...allBranchesWithCounts].sort((a, b) => b.visits - a.visits);

        // Display Top 3 Branches with Maximum Visits
        reportDisplay.innerHTML += `<h3>Top 3 Branches with Maximum Visits:</h3>`;
        const top3MaxVisits = sortedByVisitsDesc.slice(0, 3);
        if (top3MaxVisits.length > 0) {
            top3MaxVisits.forEach(data => {
                reportDisplay.innerHTML += `
                    <div class="leaderboard-item top-performer">
                        <strong>${data.name}</strong>
                        <span>${data.visits} Visits</span>
                    </div>
                `;
            });
        } else {
            reportDisplay.innerHTML += '<p>No visit data available.</p>';
        }

        // Sort for Lowest Visits (ascending)
        const sortedByVisitsAsc = [...allBranchesWithCounts].sort((a, b) => a.visits - b.visits);

        // Display Top 3 Branches with Lowest Visits (could include 0-visit branches)
        reportDisplay.innerHTML += `<h3>Top 3 Branches with Lowest Visits:</h3>`;
        const top3MinVisits = sortedByVisitsAsc.slice(0, 3);
        if (top3MinVisits.length > 0) {
            top3MinVisits.forEach(data => {
                reportDisplay.innerHTML += `
                    <div class="leaderboard-item low-performer">
                        <strong>${data.name}</strong>
                        <span>${data.visits} Visits</span>
                    </div>
                `;
            });
        } else {
            reportDisplay.innerHTML += '<p>No visit data available.</p>';
        }

        // Display all branches sorted by visits
        // In renderBranchVisitLeaderboard function:

    // ... (previous code for Max and Min Visits) ...

    // Display all branches sorted by visits in two horizontal tables
    reportDisplay.innerHTML += '<h3>All Branches by Visits:</h3>';
    const totalBranches = sortedByVisitsDesc.length;
    const halfWayPoint = Math.ceil(totalBranches / 2);

    const firstHalf = sortedByVisitsDesc.slice(0, halfWayPoint);
    const secondHalf = sortedByVisitsDesc.slice(halfWayPoint);

    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'two-tables-container';

    // Create First Table
    const table1 = document.createElement('table');
    table1.className = 'all-branch-snapshot-table'; // Reuse existing table style
    let thead1 = table1.createTHead();
    let headerRow1 = thead1.insertRow();
    ['Branch Name', 'Total Visits'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow1.appendChild(th);
    });
    let tbody1 = table1.createTBody();
    firstHalf.forEach(data => {
        const row = tbody1.insertRow();
        row.insertCell().textContent = data.name;
        row.insertCell().textContent = data.visits;
    });
    tablesContainer.appendChild(table1);

    // Create Second Table
    if (secondHalf.length > 0) { // Only create if there's data for the second half
        const table2 = document.createElement('table');
        table2.className = 'all-branch-snapshot-table'; // Reuse existing table style
        let thead2 = table2.createTHead();
        let headerRow2 = thead2.insertRow();
        ['Branch Name', 'Total Visits'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow2.appendChild(th);
        });
        let tbody2 = table2.createTBody();
        secondHalf.forEach(data => {
            const row = tbody2.insertRow();
            row.insertCell().textContent = data.name;
            row.insertCell().textContent = data.visits;
        });
        tablesContainer.appendChild(table2);
    }
    
    reportDisplay.appendChild(tablesContainer);
}

    // --- UPDATED: Branch Call Leaderboard Report ---
    function renderBranchCallLeaderboard() {
        reportDisplay.innerHTML = '<h2>Branch Call Analysis</h2>';

        const branchCallCounts = {};

        // Aggregate calls for each branch
        allCanvassingData.forEach(entry => {
            const branch = entry[HEADER_BRANCH_NAME];
            const activityType = entry[HEADER_ACTIVITY_TYPE] ? entry[HEADER_ACTIVITY_TYPE].trim().toLowerCase() : '';

            if (branch && activityType === 'calls') {
                branchCallCounts[branch] = (branchCallCounts[branch] || 0) + 1;
            }
        });

        // Initialize all predefined branches with 0 calls if they don't have any entries
        const allBranchesWithCounts = PREDEFINED_BRANCHES.map(branch => ({
            name: branch,
            calls: branchCallCounts[branch] || 0
        }));

        if (allBranchesWithCounts.length === 0) {
            reportDisplay.innerHTML += '<p>No branch data available to generate this report.</p>';
            return;
        }

        // Sort for Max Calls (descending)
        const sortedByCallsDesc = [...allBranchesWithCounts].sort((a, b) => b.calls - a.calls);

        // Display Top 3 Branches with Maximum Calls
        reportDisplay.innerHTML += `<h3>Top 3 Branches with Maximum Calls:</h3>`;
        const top3MaxCalls = sortedByCallsDesc.slice(0, 3);
        if (top3MaxCalls.length > 0) {
            top3MaxCalls.forEach(data => {
                reportDisplay.innerHTML += `
                    <div class="leaderboard-item top-performer">
                        <strong>${data.name}</strong>
                        <span>${data.calls} Calls</span>
                    </div>
                `;
            });
        } else {
            reportDisplay.innerHTML += '<p>No call data available.</p>';
        }

        // Sort for Lowest Calls (ascending)
        const sortedByCallsAsc = [...allBranchesWithCounts].sort((a, b) => a.calls - b.calls);

        // Display Top 3 Branches with Lowest Calls (could include 0-call branches)
        reportDisplay.innerHTML += `<h3>Top 3 Branches with Lowest Calls:</h3>`;
        const top3MinCalls = sortedByCallsAsc.slice(0, 3);
        if (top3MinCalls.length > 0) {
            top3MinCalls.forEach(data => {
                reportDisplay.innerHTML += `
                    <div class="leaderboard-item low-performer">
                        <strong>${data.name}</strong>
                        <span>${data.calls} Calls</span>
                    </div>
                `;
            });
        } else {
            reportDisplay.innerHTML += '<p>No call data available.</p>';
        }

        // Display all branches sorted by calls
        // In renderBranchCallLeaderboard function:

    // ... (previous code for Max and Min Calls) ...

    // Display all branches sorted by calls in two horizontal tables
    reportDisplay.innerHTML += '<h3>All Branches by Calls:</h3>';
    const totalBranches = sortedByCallsDesc.length;
    const halfWayPoint = Math.ceil(totalBranches / 2);

    const firstHalf = sortedByCallsDesc.slice(0, halfWayPoint);
    const secondHalf = sortedByCallsDesc.slice(halfWayPoint);

    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'two-tables-container';

    // Create First Table
    const table1 = document.createElement('table');
    table1.className = 'all-branch-snapshot-table'; // Reuse existing table style
    let thead1 = table1.createTHead();
    let headerRow1 = thead1.insertRow();
    ['Branch Name', 'Total Calls'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow1.appendChild(th);
    });
    let tbody1 = table1.createTBody();
    firstHalf.forEach(data => {
        const row = tbody1.insertRow();
        row.insertCell().textContent = data.name;
        row.insertCell().textContent = data.calls;
    });
    tablesContainer.appendChild(table1);

    // Create Second Table
    if (secondHalf.length > 0) { // Only create if there's data for the second half
        const table2 = document.createElement('table');
        table2.className = 'all-branch-snapshot-table'; // Reuse existing table style
        let thead2 = table2.createTHead();
        let headerRow2 = thead2.insertRow();
        ['Branch Name', 'Total Calls'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow2.appendChild(th);
        });
        let tbody2 = table2.createTBody();
        secondHalf.forEach(data => {
            const row = tbody2.insertRow();
            row.insertCell().textContent = data.name;
            row.insertCell().textContent = data.calls;
        });
        tablesContainer.appendChild(table2);
    }
    
    reportDisplay.appendChild(tablesContainer);
}
    // --- NEW: Staff Participation Report ---
    function renderStaffParticipation() {
        reportDisplay.innerHTML = '<h2>Staff Participation Report (This Month)</h2>';

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const employeeActivitySummary = {}; // {employeeCode: {name, branch, designation, totalActivities: {Visit, Call, Reference, New Customer Leads}}}

        // Initialize all unique employees with zero activity for current month
        allUniqueEmployees.forEach(employeeCode => {
            const employeeName = employeeCodeToNameMap[employeeCode] || employeeCode;
            const branchName = allCanvassingData.find(entry => entry[HEADER_EMPLOYEE_CODE] === employeeCode)?.[HEADER_BRANCH_NAME] || 'N/A';
            const designation = employeeCodeToDesignationMap[employeeCode] || 'N/A';

            employeeActivitySummary[employeeCode] = {
                name: employeeName,
                branch: branchName,
                designation: designation,
                totalActivities: { 'Visit': 0, 'Call': 0, 'Reference': 0, 'New Customer Leads': 0 },
                hasActivityThisMonth: false // Flag to track participation
            };
        });

        // Aggregate activities for the current month
        allCanvassingData.forEach(entry => {
            const entryDate = new Date(entry[HEADER_TIMESTAMP]);
            if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
                const employeeCode = entry[HEADER_EMPLOYEE_CODE];
                if (employeeActivitySummary[employeeCode]) {
                    const activityType = entry[HEADER_ACTIVITY_TYPE] ? entry[HEADER_ACTIVITY_TYPE].trim().toLowerCase() : '';
                    const typeOfCustomer = entry[HEADER_TYPE_OF_CUSTOMER] ? entry[HEADER_TYPE_OF_CUSTOMER].trim().toLowerCase() : '';

                    if (activityType === 'visit') {
                        employeeActivitySummary[employeeCode].totalActivities['Visit']++;
                    } else if (activityType === 'calls') {
                        employeeActivitySummary[employeeCode].totalActivities['Call']++;
                    } else if (activityType === 'referance') {
                        employeeActivitySummary[employeeCode].totalActivities['Reference']++;
                    }
                    if (typeOfCustomer === 'new') {
                        employeeActivitySummary[employeeCode].totalActivities['New Customer Leads']++;
                    }
                    employeeActivitySummary[employeeCode].hasActivityThisMonth = true;
                }
            }
        });

        const tableContainer = document.createElement('div');
        tableContainer.className = 'data-table-container'; // For horizontal scrolling
        
        const table = document.createElement('table');
        table.className = 'performance-table'; // Reuse existing table style
        
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['Employee Name', 'Branch', 'Designation', 'Total Visits', 'Total Calls', 'Total References', 'Total New Customer Leads', 'Participation Status'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();

        const sortedEmployees = Object.values(employeeActivitySummary).sort((a, b) => a.name.localeCompare(b.name));

        if (sortedEmployees.length === 0) {
            reportDisplay.innerHTML += '<p>No staff data available.</p>';
            return;
        }

        sortedEmployees.forEach(emp => {
            const row = tbody.insertRow();
            row.insertCell().textContent = emp.name;
            row.insertCell().textContent = emp.branch;
            row.insertCell().textContent = emp.designation;
            row.insertCell().textContent = emp.totalActivities['Visit'];
            row.insertCell().textContent = emp.totalActivities['Call'];
            row.insertCell().textContent = emp.totalActivities['Reference'];
            row.insertCell().textContent = emp.totalActivities['New Customer Leads'];
            const participationCell = row.insertCell();
            participationCell.textContent = emp.hasActivityThisMonth ? 'Participating' : 'Non-Participating';
            participationCell.classList.add(emp.hasActivityThisMonth ? 'status-participating' : 'status-non-participating');
        });

        tableContainer.appendChild(table);
        reportDisplay.appendChild(tableContainer);
    }
    // Function to send data to Google Apps Script
    async function sendDataToGoogleAppsScript(action, data) {
        displayMessage(`Sending data for ${action}...`, 'info');
        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'cors', // Crucial for cross-origin requests
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, data }),
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
                // No need to re-render employee specific reports here, as they are triggered by employeeSelect change
            } else if (activeTabButton && detailedCustomerViewSection.style.display === 'block') {
                 // If on detailed customer view tab, re-render its controls and clear display
                 renderDetailedCustomerViewControls();
                 customerViewBranchSelect.value = '';
                 customerViewEmployeeSelect.value = '';
                 customerCanvassedList.innerHTML = '<p>Select a branch and employee to see customers.</p>';
                 // This will now clear the cards by calling renderCustomerDetails with null
                 renderCustomerDetails(null); 
            }
        }
    }

    // Event Listeners for main report buttons
    viewBranchPerformanceReportBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
        viewBranchPerformanceReportBtn.classList.add('active');
        renderBranchPerformanceReport(branchSelect.value);
    });

    viewEmployeeSummaryBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
        viewEmployeeSummaryBtn.classList.add('active');
        renderEmployeeSummary(selectedEmployeeCodeEntries);
    });

    viewAllEntriesBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
        viewAllEntriesBtn.classList.add('active');
        renderEmployeeDetailedEntries(selectedEmployeeCodeEntries);
    });

    viewPerformanceReportBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
        viewPerformanceReportBtn.classList.add('active');
        renderEmployeePerformanceReport(selectedEmployeeCodeEntries);
    });
// Add these lines below existing event listeners
    viewBranchVisitLeaderboardBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
        viewBranchVisitLeaderboardBtn.classList.add('active');
        renderBranchVisitLeaderboard();
    });

    viewBranchCallLeaderboardBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
        viewBranchCallLeaderboardBtn.classList.add('active');
        renderBranchCallLeaderboard();
    });

    viewStaffParticipationBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-options .btn').forEach(btn => btn.classList.remove('active'));
        viewStaffParticipationBtn.classList.add('active');
        renderStaffParticipation();
    });

    // --- Tab Switching Logic ---
    function showTab(tabButtonId) {
        // Deactivate all tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        // Hide all main content sections
        reportsSection.style.display = 'none';
        detailedCustomerViewSection.style.display = 'none'; // NEW
        employeeManagementSection.style.display = 'none';

        // Activate the clicked tab button
        document.getElementById(tabButtonId).classList.add('active');

        // Clear active state for report sub-buttons when changing main tabs
        document.querySelectorAll('.view-options button').forEach(btn => btn.classList.remove('active'));


        if (tabButtonId === 'allBranchSnapshotTabBtn' || tabButtonId === 'allStaffOverallPerformanceTabBtn' || tabButtonId === 'nonParticipatingBranchesTabBtn') {
            reportsSection.style.display = 'block';
            // Show controls panel for tabs that need it, hide for others
            document.querySelector('.controls-panel').style.display = 'flex';
            // Reset dropdowns for global reports
            branchSelect.value = '';
            employeeSelect.value = '';
            employeeFilterPanel.style.display = 'none';
            viewOptions.style.display = 'none';

            if (tabButtonId === 'allBranchSnapshotTabBtn') {
                renderAllBranchSnapshot();
            } else if (tabButtonId === 'allStaffOverallPerformanceTabBtn') {
                renderOverallStaffPerformanceReport();
            } else if (tabButtonId === 'nonParticipatingBranchesTabBtn') {
                renderNonParticipatingBranches();
            }
        } else if (tabButtonId === 'detailedCustomerViewTabBtn') { // NEW TAB LOGIC
            detailedCustomerViewSection.style.display = 'block';
            // Hide the general controls panel as it's not used here
            document.querySelector('.controls-panel').style.display = 'none';
            renderDetailedCustomerViewControls(); // Initialize controls for this tab
            customerCanvassedList.innerHTML = '<p>Select a branch and employee to see customers.</p>'; // Clear list
            // Clear the content of the cards when the tab is switched
            if (customerCard1) customerCard1.innerHTML = '<h3>Canvassing Activity</h3><p>Select a customer from the list to view their details.</p>';
            if (customerCard2) customerCard2.innerHTML = '<h3>Customer Overview</h3><p>Select a customer from the list to view their details.</p>';
            if (customerCard3) customerCard3.innerHTML = '<h3>More Details</h3><p>Select a customer from the list to view their details.</p>';
        } else if (tabButtonId === 'employeeManagementTabBtn') {
            employeeManagementSection.style.display = 'block';
            // Hide the general controls panel
            document.querySelector('.controls-panel').style.display = 'none';
        }
    }

    // Event Listeners for Main Tab Buttons
    allBranchSnapshotTabBtn.addEventListener('click', () => showTab('allBranchSnapshotTabBtn'));
    allStaffOverallPerformanceTabBtn.addEventListener('click', () => showTab('allStaffOverallPerformanceTabBtn'));
    nonParticipatingBranchesTabBtn.addEventListener('click', () => showTab('nonParticipatingBranchesTabBtn')); // NEW
    detailedCustomerViewTabBtn.addEventListener('click', () => showTab('detailedCustomerViewTabBtn')); // NEW
    employeeManagementTabBtn.addEventListener('click', () => showTab('employeeManagementTabBtn'));


    // --- NEW: Detailed Customer View Tab Functions ---

    function renderDetailedCustomerViewControls() {
        populateDropdown(customerViewBranchSelect, allUniqueBranches);
        customerViewEmployeeSelect.innerHTML = '<option value="">-- Select --</option>'; // Clear employee dropdown initially
    }

    customerViewBranchSelect.addEventListener('change', () => {
        const selectedBranch = customerViewBranchSelect.value;
        customerViewEmployeeSelect.innerHTML = '<option value="">-- Select --</option>'; // Clear employee list on branch change
        customerCanvassedList.innerHTML = '<p>Select an employee to see customers.</p>';
        // Clear the content of the cards when branch changes
        if (customerCard1) customerCard1.innerHTML = '<h3>Canvassing Activity</h3><p>Select a customer from the list to view their details.</p>';
        if (customerCard2) customerCard2.innerHTML = '<h3>Customer Overview</h3><p>Select a customer from the list to view their details.</p>';
        if (customerCard3) customerCard3.innerHTML = '<h3>More Details</h3><p>Select a customer from the list to view their details.</p>';


        if (selectedBranch) {
            const employeeCodesInBranchFromCanvassing = allCanvassingData
                .filter(entry => entry[HEADER_BRANCH_NAME] === selectedBranch)
                .map(entry => entry[HEADER_EMPLOYEE_CODE]);

            const combinedEmployeeCodes = new Set([...employeeCodesInBranchFromCanvassing]);
            const sortedEmployeeCodesInBranch = [...combinedEmployeeCodes].sort((codeA, codeB) => {
                const nameA = employeeCodeToNameMap[codeA] || codeA;
                const nameB = employeeCodeToNameMap[codeB] || codeB;
                return nameA.localeCompare(nameB);
            });
            populateDropdown(customerViewEmployeeSelect, sortedEmployeeCodesInBranch, true);
        }
    });

    customerViewEmployeeSelect.addEventListener('change', () => {
        const selectedEmployeeCode = customerViewEmployeeSelect.value;
        const selectedBranch = customerViewBranchSelect.value; // Get selected branch for filtering
        customerCanvassedList.innerHTML = ''; // Clear previous customer list
        // Clear the content of the cards when employee changes
        if (customerCard1) customerCard1.innerHTML = '<h3>Canvassing Activity</h3><p>Select a customer from the list to view their details.</p>';
        if (customerCard2) customerCard2.innerHTML = '<h3>Customer Overview</h3><p>Select a customer from the list to view their details.</p>';
        if (customerCard3) customerCard3.innerHTML = '<h3>More Details</h3><p>Select a customer from the list to view their details.</p>';


        if (selectedEmployeeCode && selectedBranch) {
            // Filter unique customers canvassed by this employee in this branch
            const customersCanvassed = allCanvassingData.filter(entry =>
                entry[HEADER_EMPLOYEE_CODE] === selectedEmployeeCode &&
                entry[HEADER_BRANCH_NAME] === selectedBranch &&
                entry[HEADER_PROSPECT_NAME] // Ensure Prospect Name exists
            ).map(entry => {
                // Return the whole entry for detailed view later, but ensure uniqueness by name
                // To handle multiple entries for the same customer, we'll pick the most recent one or the first one.
                return {
                    name: entry[HEADER_PROSPECT_NAME],
                    entry: entry // Store the full entry for later display
                };
            }).reduce((acc, current) => {
                // Ensure unique customers by name, keep the last entry if duplicates exist
                if (!acc.find(item => item.name === current.name)) {
                    acc.push(current);
                }
                return acc;
            }, []);

            if (customersCanvassed.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'customer-list';
                customersCanvassed.sort((a, b) => a.name.localeCompare(b.name)).forEach(customer => {
                    const li = document.createElement('li');
                    li.textContent = customer.name;
                    li.dataset.prospectName = customer.name; // Store prospect name for lookup
                    li.classList.add('customer-list-item');
                    ul.appendChild(li);
                });
                customerCanvassedList.appendChild(ul);
            } else {
                customerCanvassedList.innerHTML = '<p>No customers found for this employee in the selected branch.</p>';
            }
        } else {
            customerCanvassedList.innerHTML = '<p>Select a branch and employee to see customers.</p>';
        }
    });

    // Event listener for clicking on a customer in the list
    customerCanvassedList.addEventListener('click', (event) => {
        if (event.target.classList.contains('customer-list-item')) {
            // Remove active class from previously selected item
            document.querySelectorAll('.customer-list-item').forEach(item => item.classList.remove('active'));
            // Add active class to clicked item
            event.target.classList.add('active');

            const prospectName = event.target.dataset.prospectName;
            const selectedEmployeeCode = customerViewEmployeeSelect.value;
            const selectedBranch = customerViewBranchSelect.value;

            // Find the *latest* entry for this specific prospect, employee, and branch
            // This ensures we get the most up-to-date details if a customer has multiple entries
            const customerEntry = allCanvassingData
                .filter(entry =>
                    entry[HEADER_PROSPECT_NAME] === prospectName &&
                    entry[HEADER_EMPLOYEE_CODE] === selectedEmployeeCode &&
                    entry[HEADER_BRANCH_NAME] === selectedBranch
                )
                .sort((a, b) => {
                    // Sort by timestamp descending to get the most recent entry
                    const dateA = new Date(a[HEADER_TIMESTAMP]);
                    const dateB = new Date(b[HEADER_TIMESTAMP]);
                    return dateB.getTime() - dateA.getTime();
                })[0]; // Take the first (most recent) entry

            if (customerEntry) {
                renderCustomerDetails(customerEntry);
            } else {
                // If no entry found, clear details in cards
                if (customerCard1) customerCard1.innerHTML = '<h3>Canvassing Activity</h3><p>Details not found for this customer.</p>';
                if (customerCard2) customerCard2.innerHTML = '<h3>Customer Overview</h3><p>Details not found for this customer.</p>';
                if (customerCard3) customerCard3.innerHTML = '<h3>More Details</h3><p>Details not found for this customer.</p>';
            }
        }
    });

    // Modified function to render customer details into the three cards
    function renderCustomerDetails(customerEntry) {
        // Helper function to create a detail row
        const createDetailRow = (label, value) => {
            return `
                <div class="detail-row">
                    <span class="detail-label">${label}:</span>
                    <span class="detail-value">${value || 'N/A'}</span>
                </div>
            `;
        };

        // Clear previous content in all cards
        customerCard1.innerHTML = '<h3>Canvassing Activity</h3>';
        customerCard2.innerHTML = '<h3>Customer Overview</h3>';
        customerCard3.innerHTML = '<h3>More Details</h3>';

        if (!customerEntry) {
            customerCard1.innerHTML += '<p>Select a customer from the list to view their details.</p>';
            customerCard2.innerHTML += '<p>Select a customer from the list to view their details.</p>';
            customerCard3.innerHTML += '<p>Select a customer from the list to view their details.</p>';
            return;
        }

        // Populate Card 1: Canvassing Activity
        customerCard1.innerHTML += `
            ${createDetailRow('Date', formatDate(customerEntry[HEADER_DATE]))}
            ${createDetailRow('Branch Name', customerEntry[HEADER_BRANCH_NAME])}
            ${createDetailRow('Employee Name', customerEntry[HEADER_EMPLOYEE_NAME])}
            ${createDetailRow('Employee Code', customerEntry[HEADER_EMPLOYEE_CODE])}
            ${createDetailRow('Designation', customerEntry[HEADER_DESIGNATION])}
            ${createDetailRow('Activity Type', customerEntry[HEADER_ACTIVITY_TYPE])}
            ${createDetailRow('Type of Customer', customerEntry[HEADER_TYPE_OF_CUSTOMER])}
            ${createDetailRow('Lead Source', customerEntry[HEADER_R_LEAD_SOURCE])}
            ${createDetailRow('Product Interested', customerEntry[HEADER_PRODUCT_INTERESTED])}
            ${createDetailRow('Next Follow-up Date', formatDate(customerEntry[HEADER_NEXT_FOLLOW_UP_DATE]))}
            ${createDetailRow('Relation With Staff', customerEntry[HEADER_RELATION_WITH_STAFF])}
        `;

        // Populate Card 2: Customer Overview
        customerCard2.innerHTML += `
            ${createDetailRow('Prospect Name', customerEntry[HEADER_PROSPECT_NAME])}
            ${createDetailRow('Phone Number', customerEntry[HEADER_PHONE_NUMBER_WHATSAPP])}
            ${createDetailRow('Address', customerEntry[HEADER_ADDRESS])}
            ${createDetailRow('Profession', customerEntry[HEADER_PROFESSION])}
            ${createDetailRow('DOB/WD', customerEntry[HEADER_DOB_WD])}
        `;

        // Populate Card 3: Family Details, Customer Profile, Remarks
        customerCard3.innerHTML += `
            <h4>Family Details</h4>
            ${createDetailRow('Spouse Name', customerEntry[HEADER_FAMILY_DETAILS_1])}
            ${createDetailRow('Spouse Job', customerEntry[HEADER_FAMILY_DETAILS_2])}
            ${createDetailRow('Children Names', customerEntry[HEADER_FAMILY_DETAILS_3])}
            ${createDetailRow('Children Details', customerEntry[HEADER_FAMILY_DETAILS_4])}
            <h4>Customer Profile</h4>
            <p class="profile-text">${customerEntry[HEADER_PROFILE_OF_CUSTOMER] || 'N/A'}</p>
            <h4>Remarks</h4>
            <p class="remark-text">${customerEntry[HEADER_REMARKS] || 'N/A'}</p>
        `;
    }


    // Event Listener for Add Employee Form
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const newEmployee = {
                [HEADER_EMPLOYEE_NAME]: newEmployeeNameInput.value.trim(),
                [HEADER_EMPLOYEE_CODE]: newEmployeeCodeInput.value.trim(),
                [HEADER_BRANCH_NAME]: newBranchNameInput.value.trim(),
                [HEADER_DESIGNATION]: newDesignationInput.value.trim()
            };

            if (!newEmployee[HEADER_EMPLOYEE_NAME] || !newEmployee[HEADER_EMPLOYEE_CODE] || !newEmployee[HEADER_BRANCH_NAME]) {
                displayEmployeeManagementMessage('Employee Name, Code, and Branch Name are required.', true);
                return;
            }
            const success = await sendDataToGoogleAppsScript('add_employee', newEmployee);
            if (success) {
                addEmployeeForm.reset();
            }
        });
    }

    // Event Listener for Bulk Add Employee Form
    if (bulkAddEmployeeForm) {
        bulkAddEmployeeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const bulkDetails = bulkEmployeeDetailsTextarea.value.trim();
            const branchName = bulkEmployeeBranchNameInput.value.trim();

            if (!bulkDetails || !branchName) {
                displayEmployeeManagementMessage('Branch Name and Employee Details are required for bulk addition.', true);
                return;
            }

            const lines = bulkDetails.split('\n').filter(line => line.trim() !== '');
            const employeesToAdd = [];

            for (const line of lines) {
                const parts = line.split(',').map(part => part.trim());
                if (parts.length >= 2) { // At least Name,Code
                    const employeeData = {
                        [HEADER_EMPLOYEE_NAME]: parts[0],
                        [HEADER_EMPLOYEE_CODE]: parts[1],
                        [HEADER_BRANCH_NAME]: branchName,
                        [HEADER_DESIGNATION]: parts[2] || ''
                    };
                    employeesToAdd.push(employeeData);
                }
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

    // --- NEW: Event Listener for "All Staff Performance (Overall)" tab button ---
    //const allStaffOverallPerformanceTabBtn = document.getElementById('allStaffOverallPerformanceTabBtn');
    if (allStaffOverallPerformanceTabBtn) {
        allStaffOverallPerformanceTabBtn.addEventListener('click', () => {
            showTab('allStaffOverallPerformanceTabBtn');
            renderOverallStaffPerformanceReport();
        });
    }

 // NEW: Event Listener for "Download Overall Staff Performance CSV" button
if (downloadOverallStaffPerformanceReportBtn) { // This variable is correct
    // CORRECTED LINE: Ensure this matches the declaration at the top
    downloadOverallStaffPerformanceReportBtn.addEventListener('click', () => { 
        downloadOverallStaffPerformanceReportCSV();
    });
}
    // --- END NEW ---

    // Initial data fetch and tab display when the page loads
    processData();
    showTab('allBranchSnapshotTabBtn');
}); // This is the closing brace for DOMContentLoaded
