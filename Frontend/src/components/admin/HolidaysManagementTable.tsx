import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';
import * as ExcelJS from 'exceljs';

interface HolidayFormData {
  name: string;
  date: string;
  description: string;
  isRecurring: boolean;
}

interface ExcelHolidayRow {
  name: string;
  date: string;
  description: string;
  isRecurring: string;
}

export default function HolidaysManagementTable() {
  const { holidays, loadingLeaveData, fetchHolidays, createHoliday, updateHoliday, deleteHoliday, bulkCreateHolidays } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: '',
    description: '',
    isRecurring: true
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    // console.log('Fetching holidays for year:', selectedYear);
    fetchHolidays(selectedYear);
    setCurrentPage(1);
  }, [fetchHolidays, selectedYear]);

  useEffect(() => {
    // console.log('Current holidays:', holidays);
  }, [holidays]);

  // Pagination calculations
  const totalPages = Math.ceil(holidays.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = holidays.slice(startIndex, endIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, formData);
        toast.success('Holiday updated successfully');
      } else {
        await createHoliday(formData);
        toast.success('Holiday created successfully');
      }
      resetForm();
      setCurrentPage(1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save holiday');
    }
  };

  const handleEdit = (holiday: any) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date.split('T')[0],
      description: holiday.description || '',
      isRecurring: holiday.isRecurring
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await deleteHoliday(id);
        toast.success('Holiday deleted successfully');
        if (currentItems.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete holiday');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setShowExcelModal(false);
    setEditingHoliday(null);
    setFormData({ name: '', date: '', description: '', isRecurring: true });
  };

  // Excel Export Function
  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Holidays');

      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date (YYYY-MM-DD)', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Is Recurring (true/false)', key: 'isRecurring', width: 20 }
      ];

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };

      // Add data
      holidays.forEach(holiday => {
        worksheet.addRow({
          name: holiday.name,
          date: holiday.date.split('T')[0],
          description: holiday.description || '',
          isRecurring: holiday.isRecurring.toString()
        });
      });

      // Create blob and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `holidays_${selectedYear}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Holidays exported successfully');
    } catch (error) {
      // console.error('Export error:', error);
      toast.error('Failed to export holidays');
    } finally {
      setExportLoading(false);
    }
  };

  // Excel Import Function
  // Updated importFromExcel function in your store
const importFromExcel = async (file: File) => {
  setImportLoading(true);
  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }

    const holidaysToImport: HolidayFormData[] = [];
    let successCount = 0;
    let errorCount = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const name = row.getCell(1).value?.toString()?.trim();
      const dateCell = row.getCell(2);
      const description = row.getCell(3).value?.toString()?.trim() || '';
      const isRecurring = row.getCell(4).value?.toString()?.trim().toLowerCase() === 'true';

      // Validate required fields
      if (!name || !dateCell.value) {
        errorCount++;
        // console.warn(`Skipping row ${rowNumber}: Missing required fields`);
        return;
      }

      let dateString: string;

      // Handle different date formats from Excel
      if (dateCell.value instanceof Date) {
        // Excel Date object
        const date = dateCell.value as Date;
        dateString = formatDateToDDMMYY(date);
      } else if (typeof dateCell.value === 'number') {
        // Excel serial date number
        const date = excelSerialToDate(dateCell.value);
        dateString = formatDateToDDMMYY(date);
      } else {
        // String date - try to parse it
        const dateStr = dateCell.value.toString().trim();
        try {
          const parsedDate = parseDateString(dateStr);
          dateString = formatDateToDDMMYY(parsedDate);
        } catch (error) {
          errorCount++;
          // console.warn(`Skipping row ${rowNumber}: Invalid date format - ${dateStr}`);
          return;
        }
      }

      // Validate the final date string
      if (!isValidDDMMYY(dateString)) {
        errorCount++;
        // console.warn(`Skipping row ${rowNumber}: Invalid date format after conversion - ${dateString}`);
        return;
      }

      holidaysToImport.push({
        name,
        date: dateString,
        description,
        isRecurring
      });
      successCount++;
    });

    if (holidaysToImport.length > 0) {
      await bulkCreateHolidays(holidaysToImport);
      toast.success(`Imported ${successCount} holidays successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      setShowExcelModal(false);
      fetchHolidays(selectedYear);
    } else {
      toast.error('No valid holidays found in the Excel file');
    }
  } catch (error: any) {
    // console.error('Import error:', error);
    toast.error(error.message || 'Failed to import holidays');
  } finally {
    setImportLoading(false);
  }
};

// Add these helper functions to your component:

// Convert Excel serial number to Date
const excelSerialToDate = (serial: number): Date => {
  // Excel date serial numbers start from January 1, 1900
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  // Adjust for Excel's leap year bug
  if (serial >= 60) {
    date_info.setSeconds(date_info.getSeconds() + 1);
  }
  
  return date_info;
};

// Format Date to dd/mm/yy
const formatDateToDDMMYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Parse various date string formats
const parseDateString = (dateStr: string): Date => {
  // Try different date formats
  const formats = [
    // dd/mm/yy or dd/mm/yyyy
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
    // dd-mm-yy or dd-mm-yyyy
    /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
    // yyyy-mm-dd
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // mm/dd/yy or mm/dd/yyyy
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let day, month, year;

      if (format === formats[2]) {
        // yyyy-mm-dd format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else if (format === formats[3]) {
        // mm/dd/yy format (US)
        month = parseInt(match[1]) - 1;
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else {
        // dd/mm/yy or dd-mm-yy format
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]);
      }

      // Handle 2-digit years
      if (year < 100) {
        year += 2000; // Adjust for 21st century
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try JavaScript Date parsing as fallback
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
};

// Validate dd/mm/yy format
const isValidDDMMYY = (dateStr: string): boolean => {
  const pattern = /^(\d{2})\/(\d{2})\/(\d{2})$/;
  const match = dateStr.match(pattern);
  
  if (!match) return false;
  
  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]) + 2000; // Convert to full year
  
  // Basic validation
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // More accurate day validation
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
};

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx')) {
        toast.error('Please upload an Excel file (.xlsx)');
        return;
      }
      importFromExcel(file);
    }
  };

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Holidays Template');

      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date (YYYY-MM-DD)', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Is Recurring (true/false)', key: 'isRecurring', width: 20 }
      ];

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F0E6' }
      };

      // Add example data
      worksheet.addRow({
        name: 'New Year Day',
        date: '2024-01-01',
        description: 'Celebration of new year',
        isRecurring: 'true'
      });
      worksheet.addRow({
        name: 'Company Event',
        date: '2024-03-15',
        description: 'Annual company event',
        isRecurring: 'false'
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'holidays_template.xlsx';
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully');
    } catch (error) {
      // console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);

  const Pagination = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
        <span className="font-medium">{Math.min(endIndex, holidays.length)}</span> of{' '}
        <span className="font-medium">{holidays.length}</span> results
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Holidays</h2>
            <p className="text-gray-600 text-sm">Manage company holidays and recurring events</p>
            <p className="text-xs text-gray-500 mt-1">
              Debug: {holidays.length} holidays loaded for {selectedYear}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
              >
                Add Holiday
              </button>
              <button
                onClick={exportToExcel}
                disabled={exportLoading || holidays.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
              >
                {exportLoading ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                onClick={() => setShowExcelModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition text-sm font-medium"
              >
                Import Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingLeaveData ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Loading holidays...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-calendar-xmark text-gray-400 text-2xl mb-2"></i>
                      <p>No holidays found for {selectedYear}</p>
                      <p className="text-sm mt-1">Try a different year or add new holidays</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setShowForm(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Add your first holiday
                        </button>
                        <span className="text-gray-400">or</span>
                        <button
                          onClick={() => setShowExcelModal(true)}
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          Import from Excel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                      {holiday.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{holiday.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(holiday.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          holiday.isRecurring
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {holiday.isRecurring ? 'Recurring' : 'One-time'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(holiday)}
                        className="text-blue-600 hover:text-blue-900 transition text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(holiday.id)}
                        className="text-red-600 hover:text-red-900 transition text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {holidays.length > 0 && <Pagination />}

      {/* Holiday Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingHoliday ? 'Edit Holiday' : 'Create New Holiday'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Christmas Day"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Recurring (every year)</label>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                  >
                    {editingHoliday ? 'Update' : 'Create'} Holiday
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Import Holidays from Excel</h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">File Format Requirements:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• File must be in .xlsx format</li>
                    <li>• First row should contain headers</li>
                    <li>• Required columns: Name, Date (YYYY-MM-DD), Is Recurring (true/false)</li>
                    <li>• Optional column: Description</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={downloadTemplate}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm font-medium"
                  >
                    Download Template
                  </button>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <input
                      type="file"
                      id="excel-file"
                      accept=".xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="excel-file"
                      className="cursor-pointer block"
                    >
                      <div className="text-gray-600">
                        <i className="fa-solid fa-upload text-2xl mb-2"></i>
                        <p className="text-sm">
                          {importLoading ? 'Importing...' : 'Click to upload Excel file'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">.xlsx files only</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}