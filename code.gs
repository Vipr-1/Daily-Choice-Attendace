/**
 * Copyright (C) 2025  Damon Pashko
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Affero General Public License as
 *    published by the Free Software Foundation, either version 3 of the
 *    License, or (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

//Declaring Constants
//class list with drop down of of choices for each student
const CLASS_LIST_SHEET_ID = PLACEHOLDER; //The id of a google sheet is in the URI: https://docs.google.com/spreadsheets/d/<YOUR ID HERE>/edit?gid=0#gid=0
const LIST_OF_CLASS_TABS = [
//adjust this with verbatim names of classes of students. These names should be identical to the names of the tabs in the above sheet and the order should be kept
    'Class 1',
    'Class 2',
    'and so on'
];

//attendance list for each choice or teacher
const TEACHER_ATTENDANCE_SHEET_ID = PLACEHOLDER2; //The id of a google sheet is in the URI: https://docs.google.com/spreadsheets/d/<YOUR ID HERE>/edit?gid=0#gid=0
const LIST_OF_TEACHER_TABS = [
//adjust this with verbatim names of the choices in this case teachers. These names should be identical to the names of the tabs in the above sheet and the order should be kept
    'Teacher 1',
    'Teacher 2',
    'and so on'
];

// --- MAIN FUNCTION TO RUN ---
function run() {
    //Only run if school is open
    clearTeacherTabs();
    if(!afterHours(checkDate())){
        distributeChoices();
    }
}

/**
 * Collects all student names and their choices from class list sheets.
 * Assumes data is in columns B (studentClass), C (studentLastName), D (studentFirstName), E (aceChoice),
 * starting from row 3.
 * @returns {Array<Object>} An array of objects, e.g., [{ grade: 'Class 1', lastName: 'Doe', firstName: 'John', choice: 'Teacher 1' }]
 */
function collectAllChoices() {
    const sheetsOfClasses = SpreadsheetApp.openById(CLASS_LIST_SHEET_ID);
    let allChoices = []; // Stores students, their class, and choice

    LIST_OF_CLASS_TABS.forEach(tabName => { // Use forEach for iterating array values
        const classSheet = sheetsOfClasses.getSheetByName(tabName); // Robustly get sheet by name
        if (!classSheet) {
            Logger.log(`ERROR: Class sheet "${tabName}" not found in CLASS_LIST_SHEET_ID: ${CLASS_LIST_SHEET_ID}. Please check tab names.`);
            return; // Skip this sheet if not found
        }
        Logger.log(`Collecting data from tab: ${tabName}`);

        // Assuming data starts from row 3, columns B through E
        // B (index 0), C (index 1), D (index 2), E (index 3) within the retrieved 'values' array
        const dataRange = classSheet.getRange('B3:E' + classSheet.getLastRow());
        const values = dataRange.getValues();

        values.forEach(row => {
            const studentClass = row[0] ? row[0].toString().trim() : '';
        const studentLastName = row[1] ? row[1].toString().trim() : '';
        const studentFirstName = row[2] ? row[2].toString().trim() : '';
        const aceChoice = row[3] ? row[3].toString().trim() : '';

        // Ensure all essential values are present and not just empty strings
        if (studentClass && studentLastName && studentFirstName && aceChoice) {
            allChoices.push({
                grade: studentClass,
                lastName: studentLastName,
                firstName: studentFirstName,
                choice: aceChoice
            });
        }
        });
    });
    Logger.log(`Total students collected: ${allChoices.length}`);
    return allChoices;
}

/**
 * Filters students by their choice and distributes them to the correct teacher's attendance tab.
 * Clears previous data and writes new list.
 */
function distributeChoices() {
    const allChoices = collectAllChoices(); // Get the master list of students and choices
    const sheetsOfTeachers = SpreadsheetApp.openById(TEACHER_ATTENDANCE_SHEET_ID);

    LIST_OF_TEACHER_TABS.forEach(teacherName => { // Use forEach for iterating array values
        const teacherSheet = sheetsOfTeachers.getSheetByName(teacherName); // Robustly get sheet by name
        if (!teacherSheet) {
            Logger.log(`ERROR: Teacher sheet "${teacherName}" not found in TEACHER_ATTENDANCE_SHEET_ID: ${TEACHER_ATTENDANCE_SHEET_ID}. Please check tab names.`);
            return; // Skip this teacher if sheet not found
        }
        Logger.log(`Distributing to teacher: ${teacherName}`);

        // Filter students whose choice exactly matches the teacher's name
        // IMPORTANT: Ensure the value in the Choice column *exactly* matches the teacher's tab name.
        const studentsForThisTeacher = allChoices.filter(student => {
            // Trim to avoid issues with extra spaces
            return student.choice === teacherName;
        });

        // Prepare data for writing using setValues() - an array of arrays
        // Each inner array represents a row: [lastName, firstName, grade]
        const dataToWrite = studentsForThisTeacher.map(student => [
            student.lastName,
            student.firstName,
            student.grade
        ]);

        // Clear existing attendance data first, but only if there are rows to clear
        // Assuming student list starts from A2 and uses columns A, B, C for last name, first name, grade
        const firstDataRow = 2; // Row where data starts for student list
        const numColumnsToClear = 3; // Clear columns A, B, C (adjust if more columns are used for student data)

    // Calculate the actual last row that might contain data to be cleared
    // It's important to only clear if there's content to avoid the "rows must be at least 1" error
    if (teacherSheet.getLastRow() >= firstDataRow) {
        const numRowsToClear = teacherSheet.getLastRow() - firstDataRow + 1;
        const clearRange = teacherSheet.getRange(firstDataRow, 1, numRowsToClear, numColumnsToClear);
        clearRange.clearContent();
        Logger.log(`Cleared content for ${teacherName} from row ${firstDataRow} for ${numRowsToClear} rows.`);
    } else {
        Logger.log(`No existing data to clear for ${teacherName} from row ${firstDataRow}.`);
    }

    // Write the filtered list to the teacher's sheet, starting from A2
    if (dataToWrite.length > 0) {
        // Target range: starting from A2 (row 2, column 1)
        // Number of rows: dataToWrite.length
        // Number of columns: dataToWrite[0].length (which is 3 for lastName, firstName, grade)
        teacherSheet.getRange(firstDataRow, 1, dataToWrite.length, dataToWrite[0].length).setValues(dataToWrite);
        Logger.log(`Wrote ${dataToWrite.length} students to ${teacherName}'s sheet starting at A${firstDataRow}.`);
    } else {
        Logger.log(`No students found for ${teacherName} based on choice. No data written.`);
    }
    });

    Logger.log('Distribution complete!');
}

function clearTeacherTabs() {
    const sheetsOfTeachers = SpreadsheetApp.openById(TEACHER_ATTENDANCE_SHEET_ID);
    const firstDataRow = 2; // Start clearing from row 2 to preserve row 1 header

    LIST_OF_TEACHER_TABS.forEach(teacherName => {
        const teacherSheet = sheetsOfTeachers.getSheetByName(teacherName);
        if (!teacherSheet) {
            Logger.log(`ERROR: Teacher sheet "${teacherName}" not found in TEACHER_ATTENDANCE_SHEET_ID: ${TEACHER_ATTENDANCE_SHEET_ID}. Skipping clear.`);
            return;
        }
        Logger.log(`Attempting to clear tab: ${teacherName}`);

        const lastRow = teacherSheet.getLastRow();
        const lastColumn = teacherSheet.getLastColumn();

        // Only attempt to clear if there's data below the header row
        if (lastRow >= firstDataRow && lastColumn > 0) {
            const rangeToClear = teacherSheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, lastColumn);
            rangeToClear.clearContent();
            Logger.log(`Cleared content in "${teacherName}" from row ${firstDataRow} to ${lastRow}, columns A to ${lastColumn}.`);
        } else {
            Logger.log(`No content to clear in "${teacherName}" below row ${firstDataRow}.`);
        }
    });
    Logger.log('All specified teacher tabs have been cleared (headers preserved).');
}

/**
 * returns the current date "date object"
 */
function checkDate(){
    let currentDate = new Date();
    Logger.log(`The current date is "${currentDate}".`);
    return currentDate;

}
/**
 * takes the current date and returns true if the school is closed
 */
function afterHours(currentDate){
    //set the current hour as in integer (24hr) and the day of week as an integer (0-6, Sun-Sat)
    let currentHour = currentDate.getHours();
    Logger.log(`The hour is "${currentHour}".`);
    let dayOfWeek = currentDate.getDay();
    Logger.log(`The day is "${dayOfWeek}".`);
    if(currentHour>15 || currentHour<8){
        Logger.log('It is nighttime right now.');
        return true;
    }
    if(dayOfWeek == 0 || dayOfWeek == 6){
        Logger.log('It is the weekend.');
        return true;
    }
    else{
        Logger.log('School is open.')
        return false;
    }
}

/**
 * Resets all ACE choices in class list tabs to "Not Selected".
 * Assumes choices are in the fifth column (Column E) starting from row 2.
 */
function resetAceChoicesToNotSelected() {
    const sheetsOfClasses = SpreadsheetApp.openById(CLASS_LIST_SHEET_ID);
    const choiceColumn = 5; // Column E is the 5th column
    const firstChoiceRow = 2; // Choices start on the second row

    LIST_OF_CLASS_TABS.forEach(tabName => {
        const classSheet = sheetsOfClasses.getSheetByName(tabName);
        if (!classSheet) {
            Logger.log(`ERROR: Class sheet "${tabName}" not found in CLASS_LIST_SHEET_ID: ${CLASS_LIST_SHEET_ID}. Skipping reset.`);
            return;
        }
        Logger.log(`Resetting ACE choices in tab: ${tabName}`);

        const lastRow = classSheet.getLastRow();

        // Only proceed if there are rows to reset below the header
        if (lastRow >= firstChoiceRow) {
            const numRowsToReset = lastRow - firstChoiceRow + 1;
            // Create a 2D array filled with "Not Selected" for the entire range
            const valuesToSet = Array(numRowsToReset).fill(['Not Selected']);

            // Get the range and set the values
            const rangeToReset = classSheet.getRange(firstChoiceRow, choiceColumn, numRowsToReset, 1);
            rangeToReset.setValues(valuesToSet);
            Logger.log(`Set ${numRowsToReset} choices to "Not Selected" in "${tabName}", Column E.`);
        } else {
            Logger.log(`No choices to reset in "${tabName}" below row ${firstChoiceRow}.`);
        }
    });
    Logger.log('All specified class list ACE choices have been reset to "Not Selected".');
}

