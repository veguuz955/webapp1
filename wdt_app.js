class StaffMember {
    constructor(id, name, surname, email, photo, status = "In") {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.photo = photo;
        this.status = status;
        this.outTime = null;
        this.duration = null;
        this.expectedReturnTime = null;
        this.notifiedLate = false;
    }

    clockOut(duration) {
        this.status = "Out";
        this.outTime = new Date();
        this.duration = duration;
        this.expectedReturnTime = new Date(this.outTime.getTime() + duration * 60000);
        this.notifiedLate = false;
    }

    clockIn() {
        this.status = "In";
        this.outTime = null;
        this.duration = null;
        this.expectedReturnTime = null;
        this.notifiedLate = false;
    }

    isLate() {
        return this.status === "Out" && this.expectedReturnTime && new Date() > this.expectedReturnTime;
    }
}

// Array to store staff members
let staffMembers = [];

// Fetch staff data from API and initialize the staff members
async function staffUserGet() {
    try {
        const response = await fetch('https://randomuser.me/api/?results=5');
        const data = await response.json();

        staffMembers = data.results.map((user, index) =>
            new StaffMember(
                index + 1,
                user.name.first,
                user.name.last,
                user.email,
                user.picture.thumbnail
            )
        );

        populateStaffTable();
    } catch (error) {
        console.error("Error fetching staff data:", error);
    }
}

// Populate the staff table
function populateStaffTable() {
    const tableContainer = $('#staffTable');
    let tableHTML = `<table class="table table-bordered">
        <thead>
            <tr>
                <th>Picture</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Email</th>
                <th>Status</th>
                <th>Out Time</th>
                <th>Duration</th>
                <th>Expected Return Time</th>
            </tr>
        </thead>
        <tbody>`;

    staffMembers.forEach(staff => {
        tableHTML += `
            <tr data-id="${staff.id}">
                <td><img src="${staff.photo}" class="img-thumbnail" alt="staff photo"></td>
                <td>${staff.name}</td>
                <td>${staff.surname}</td>
                <td>${staff.email}</td>
                <td>${staff.status}</td>
                <td>${staff.outTime ? staff.outTime.toLocaleTimeString() : ''}</td>
                <td>${staff.duration ? formatDuration(staff.duration) : ''}</td>
                <td>${staff.expectedReturnTime ? staff.expectedReturnTime.toLocaleTimeString() : ''}</td>
            </tr>`;
    });

    tableHTML += `</tbody></table>`;
    tableContainer.html(tableHTML);

    // Attach event listeners for Out and In buttons
    $('.out-btn').click(handleClockOut);
    $('.in-btn').click(handleClockIn);

    // Attach row selection event
    $('#staffTable tbody tr').on('click', handleRowSelection);
}

// Convert duration from minutes to hours and minutes
function formatDuration(duration) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}hr ${minutes}min` : `${minutes}min`;
}

// Add event listener to highlight the selected row for the "Out" action
function handleRowSelection() {
    // Remove the 'selected-row' class from all rows
    $('#staffTable tbody tr').removeClass('selected-row');

    // Add the 'selected-row' class to the clicked row
    $(this).addClass('selected-row');
}

// Handle clocking out a staff member
function handleClockOut() {
    const selectedRow = $('#staffTable tbody tr.selected-row');
    const staffId = selectedRow.data('id');

    if (!staffId) {
        alert('Please select a staff member before clicking "Out".');
        return;
    }

    const staff = staffMembers.find(s => s.id === staffId);
    const duration = prompt("Enter duration of absence in minutes:");

    if (duration && !isNaN(duration)) {
        staff.clockOut(parseInt(duration, 10));
        populateStaffTable();

        // Ensure the newly updated row stays selected
        setTimeout(() => {
            $(`#staffTable tbody tr[data-id="${staffId}"]`).addClass('selected-row');
        }, 0);
    }
}

// Handle clocking in a staff member
function handleClockIn() {
    const staffId = $(this).closest('tr').data('id');
    const staff = staffMembers.find(s => s.id === staffId);
    staff.clockIn();
    populateStaffTable();
}

// Show a toast notification if a staff member is late
function staffMemberIsLate(staff) {
    if (staff.isLate() && !staff.notifiedLate) {
        showToastNotification(staff);
        staff.notifiedLate = true;
    }
}

// Display the toast notification
function showToastNotification(staff) {
    const toastContainer = $('#toastContainer');
    const toastHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-autohide="false">
            <div class="toast-header">
                <img src="${staff.photo}" class="rounded mr-2" alt="staff photo">
                <strong class="mr-auto">${staff.name} ${staff.surname}</strong>
                <small>Late</small>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body">
                ${staff.name} has been out for ${staff.duration} minutes and has not returned on time.
            </div>
        </div>`;

    toastContainer.append(toastHTML);
    $('.toast').toast('show');

    // Close button event listener to remove the toast
    $('.toast .close').on('click', function() {
        $(this).closest('.toast').remove();
    });
}

// Periodically check if any staff member is late
$(document).ready(function () {
    staffUserGet();

    // Check every 0.5 seconds if any staff member is late
    setInterval(() => {
        staffMembers.forEach(staff => {
            staffMemberIsLate(staff);
        });
    }, 500); // Check every 0.5 seconds
});
