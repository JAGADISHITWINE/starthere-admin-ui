// excel-upload.service.ts - IMPROVED WITH MULTI-BATCH SUPPORT

import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface TrekExcelData {
  // Basic Info (same for all batches)
  trekName: string;
  location: string;
  difficulty: string;
  category: string;
  fitnessLevel?: string;
  description?: string;

  // Arrays that apply to all batches
  highlights?: string;
  thingsToCarry?: string;
  importantNotes?: string;

  // Batch-specific data
  batchNumber?: number; // NEW: Identifies which batch this row belongs to
  startDate: string;
  endDate: string;
  availableSlots: number;
  price: number;
  minAge?: number;
  maxAge?: number;
  duration?: string;
  minParticipants?: number;
  maxParticipants?: number;
  batchStatus?: string;

  // Batch-specific arrays
  inclusions?: string;
  exclusions?: string;
  itinerary?: string;
}

export interface ParsedTrekData {
  trekInfo: {
    name: string;
    location: string;
    difficulty: string;
    category: string;
    fitnessLevel: string;
    description: string;
    highlights: string[];
    thingsToCarry: string[];
    importantNotes: string[];
  };
  batches: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ExcelUploadService {

  constructor() { }

  /**
   * Read Excel file and convert to JSON
   */
  async readExcelFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: ''
          });

          resolve({
            success: true,
            data: jsonData,
            sheetNames: workbook.SheetNames,
            workbook: workbook
          });
        } catch (error) {
          reject({
            success: false,
            error: 'Failed to parse Excel file',
            details: error
          });
        }
      };

      reader.onerror = (error) => {
        reject({
          success: false,
          error: 'Failed to read file',
          details: error
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse Trek data from Excel (supports multiple batches)
   */
  parseTrekData(excelData: any[]): TrekExcelData[] {
    return excelData.map(row => ({
      trekName: row['Trek Name'] || row['trekName'] || '',
      location: row['Location'] || row['location'] || '',
      difficulty: row['Difficulty'] || row['difficulty'] || '',
      category: row['Category'] || row['category'] || '',
      fitnessLevel: row['Fitness Level'] || row['fitnessLevel'] || '',
      description: row['Description'] || row['description'] || '',

      // Common arrays
      highlights: row['Highlights'] || row['highlights'] || '',
      thingsToCarry: row['Things to Carry'] || row['thingsToCarry'] || '',
      importantNotes: row['Important Notes'] || row['importantNotes'] || '',

      // Batch identification
      batchNumber: parseInt(row['Batch Number'] || row['batchNumber'] || '1'),

      // Batch-specific data
      startDate: row['Start Date'] || row['startDate'] || '',
      endDate: row['End Date'] || row['endDate'] || '',
      availableSlots: parseInt(row['Available Slots'] || row['availableSlots'] || '0'),
      price: parseFloat(row['Price'] || row['price'] || '0'),
      minAge: parseInt(row['Min Age'] || row['minAge'] || ''),
      maxAge: parseInt(row['Max Age'] || row['maxAge'] || ''),
      duration: row['Duration'] || row['duration'] || '',
      minParticipants: parseInt(row['Min Participants'] || row['minParticipants'] || ''),
      maxParticipants: parseInt(row['Max Participants'] || row['maxParticipants'] || ''),
      batchStatus: row['Batch Status'] || row['batchStatus'] || 'active',

      // Batch-specific arrays
      inclusions: row['Inclusions'] || row['inclusions'] || '',
      exclusions: row['Exclusions'] || row['exclusions'] || '',
      itinerary: row['Itinerary'] || row['itinerary'] || ''
    }));
  }

  /**
   * Convert parsed data to form-compatible format (with multiple batches)
   */
  convertToFormData(parsedData: TrekExcelData[]): ParsedTrekData {
    // Get trek info from first row (common to all batches)
    const firstRow = parsedData[0];

    const trekInfo = {
      name: firstRow.trekName,
      location: firstRow.location,
      difficulty: firstRow.difficulty,
      category: firstRow.category,
      fitnessLevel: firstRow.fitnessLevel || '',
      description: firstRow.description || '',
      highlights: this.splitPipeDelimited(firstRow.highlights),
      thingsToCarry: this.splitPipeDelimited(firstRow.thingsToCarry),
      importantNotes: this.splitPipeDelimited(firstRow.importantNotes)
    };

    // Group rows by batch number or treat each row as a separate batch
    const batchesMap = new Map<number, TrekExcelData[]>();

    parsedData.forEach(row => {
      const batchNum = row.batchNumber || 1;
      if (!batchesMap.has(batchNum)) {
        batchesMap.set(batchNum, []);
      }
      batchesMap.get(batchNum)!.push(row);
    });

    // Convert each batch to form format
    const batches = Array.from(batchesMap.values()).map(batchRows => {
      const batchRow = batchRows[0]; // Use first row for batch data

      return {
        startDate: this.formatDate(batchRow.startDate),
        endDate: this.formatDate(batchRow.endDate),
        availableSlots: batchRow.availableSlots,
        price: batchRow.price,
        minAge: batchRow.minAge || '',
        maxAge: batchRow.maxAge || '',
        duration: batchRow.duration || '',
        minParticipants: batchRow.minParticipants || '',
        maxParticipants: batchRow.maxParticipants || '',
        batchStatus: batchRow.batchStatus || 'active',

        inclusions: this.splitPipeDelimited(batchRow.inclusions),
        exclusions: this.splitPipeDelimited(batchRow.exclusions),

        itineraryDays: this.parseItinerary(batchRow.itinerary)
      };
    });

    return {
      trekInfo,
      batches
    };
  }

  /**
   * Split pipe-delimited string into array
   */
  private splitPipeDelimited(value?: string): string[] {
    if (!value || value.trim() === '') {
      return [''];
    }
    const items = value.split('|').map(item => item.trim()).filter(item => item !== '');
    return items.length > 0 ? items : [''];
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      // Handle Excel serial date numbers
      if (!isNaN(Number(dateString))) {
        const excelEpoch = new Date(1899, 11, 30);
        const daysOffset = Number(dateString);
        const date = new Date(excelEpoch.getTime() + daysOffset * 86400000);
        return date.toISOString().split('T')[0];
      }

      // Handle DD/MM/YYYY or DD-MM-YYYY format
      if (dateString.includes('/') || dateString.includes('-')) {
        const parts = dateString.split(/[/-]/);
        if (parts.length === 3) {
          // Check if it's already YYYY-MM-DD
          if (parts[0].length === 4) {
            return dateString;
          }
          // Assume DD/MM/YYYY format
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }

      // Try parsing as-is
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      return dateString;
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  }

  /**
   * Parse itinerary JSON string
   */
  private parseItinerary(itineraryString?: string): any[] {
    if (!itineraryString || itineraryString.trim() === '') {
      return [];
    }

    try {
      const parsed = JSON.parse(itineraryString);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.warn('Could not parse itinerary JSON:', error);
      return [];
    }
  }

  /**
   * Download sample Excel template with multiple batch examples
   */
  downloadTemplate(): void {
    const templateData = [
      // Batch 1
      {
        'Batch Number': 1,
        'Trek Name': 'Kudremukh Trek',
        'Location': 'Karnataka',
        'Difficulty': 'Moderate',
        'Category': 'Hill Trek',
        'Fitness Level': 'Intermediate',
        'Description': 'Beautiful trek through lush green forests and meadows with stunning 360° views',
        'Start Date': '2026-02-13',
        'End Date': '2026-02-15',
        'Available Slots': 25,
        'Price': 3500,
        'Min Age': 16,
        'Max Age': 60,
        'Duration': '3 Days / 2 Nights',
        'Min Participants': 10,
        'Max Participants': 25,
        'Batch Status': 'active',
        'Highlights': '360° mountain views|Grasslands|Sunset point|Wildlife spotting',
        'Inclusions': 'Transportation from Bangalore|All meals|Professional guide|Camping equipment|First aid',
        'Exclusions': 'Personal expenses|Travel insurance|Medical expenses|Extra food items',
        'Things to Carry': 'Trekking shoes with good grip|Water bottle (2L)|Sunscreen|First aid kit|Warm clothes|Rain jacket|Torch|Power bank',
        'Important Notes': 'Minimum age 16 years|Medical fitness certificate required|No smoking or alcohol|Carry valid ID proof|Follow guide instructions',
        'Itinerary': JSON.stringify([
          {
            dayNumber: 1,
            title: 'Bangalore to Base Camp',
            activities: [
              { activityTime: '06:00', activityText: 'Departure from Bangalore' },
              { activityTime: '12:00', activityText: 'Lunch break at Chikmagalur' },
              { activityTime: '18:00', activityText: 'Reach base camp and check-in' }
            ]
          },
          {
            dayNumber: 2,
            title: 'Trek to Kudremukh Peak',
            activities: [
              { activityTime: '05:00', activityText: 'Wake up and breakfast' },
              { activityTime: '06:00', activityText: 'Start trek to peak' },
              { activityTime: '12:00', activityText: 'Reach summit and lunch' },
              { activityTime: '16:00', activityText: 'Descend to base camp' }
            ]
          },
          {
            dayNumber: 3,
            title: 'Return to Bangalore',
            activities: [
              { activityTime: '07:00', activityText: 'Breakfast and pack up' },
              { activityTime: '09:00', activityText: 'Depart for Bangalore' },
              { activityTime: '18:00', activityText: 'Reach Bangalore' }
            ]
          }
        ])
      },
      // Batch 2 - Same trek, different dates
      {
        'Batch Number': 2,
        'Trek Name': 'Kudremukh Trek',
        'Location': 'Karnataka',
        'Difficulty': 'Moderate',
        'Category': 'Hill Trek',
        'Fitness Level': 'Intermediate',
        'Description': 'Beautiful trek through lush green forests and meadows with stunning 360° views',
        'Start Date': '2026-03-20',
        'End Date': '2026-03-22',
        'Available Slots': 30,
        'Price': 3500,
        'Min Age': 16,
        'Max Age': 60,
        'Duration': '3 Days / 2 Nights',
        'Min Participants': 10,
        'Max Participants': 30,
        'Batch Status': 'active',
        'Highlights': '360° mountain views|Grasslands|Sunset point|Wildlife spotting',
        'Inclusions': 'Transportation from Bangalore|All meals|Professional guide|Camping equipment|First aid',
        'Exclusions': 'Personal expenses|Travel insurance|Medical expenses|Extra food items',
        'Things to Carry': 'Trekking shoes with good grip|Water bottle (2L)|Sunscreen|First aid kit|Warm clothes|Rain jacket|Torch|Power bank',
        'Important Notes': 'Minimum age 16 years|Medical fitness certificate required|No smoking or alcohol|Carry valid ID proof|Follow guide instructions',
        'Itinerary': JSON.stringify([
          {
            dayNumber: 1,
            title: 'Bangalore to Base Camp',
            activities: [
              { activityTime: '06:00', activityText: 'Departure from Bangalore' },
              { activityTime: '12:00', activityText: 'Lunch break at Chikmagalur' },
              { activityTime: '18:00', activityText: 'Reach base camp and check-in' }
            ]
          },
          {
            dayNumber: 2,
            title: 'Trek to Kudremukh Peak',
            activities: [
              { activityTime: '05:00', activityText: 'Wake up and breakfast' },
              { activityTime: '06:00', activityText: 'Start trek to peak' },
              { activityTime: '12:00', activityText: 'Reach summit and lunch' },
              { activityTime: '16:00', activityText: 'Descend to base camp' }
            ]
          },
          {
            dayNumber: 3,
            title: 'Return to Bangalore',
            activities: [
              { activityTime: '07:00', activityText: 'Breakfast and pack up' },
              { activityTime: '09:00', activityText: 'Depart for Bangalore' },
              { activityTime: '18:00', activityText: 'Reach Bangalore' }
            ]
          }
        ])
      },
      // Batch 3 - Weekend batch
      {
        'Batch Number': 3,
        'Trek Name': 'Kudremukh Trek',
        'Location': 'Karnataka',
        'Difficulty': 'Moderate',
        'Category': 'Hill Trek',
        'Fitness Level': 'Intermediate',
        'Description': 'Beautiful trek through lush green forests and meadows with stunning 360° views',
        'Start Date': '2026-04-10',
        'End Date': '2026-04-12',
        'Available Slots': 20,
        'Price': 3800,
        'Min Age': 16,
        'Max Age': 60,
        'Duration': '3 Days / 2 Nights',
        'Min Participants': 10,
        'Max Participants': 20,
        'Batch Status': 'active',
        'Highlights': '360° mountain views|Grasslands|Sunset point|Wildlife spotting',
        'Inclusions': 'Transportation from Bangalore|All meals|Professional guide|Camping equipment|First aid',
        'Exclusions': 'Personal expenses|Travel insurance|Medical expenses|Extra food items',
        'Things to Carry': 'Trekking shoes with good grip|Water bottle (2L)|Sunscreen|First aid kit|Warm clothes|Rain jacket|Torch|Power bank',
        'Important Notes': 'Minimum age 16 years|Medical fitness certificate required|No smoking or alcohol|Carry valid ID proof|Follow guide instructions',
        'Itinerary': JSON.stringify([
          {
            dayNumber: 1,
            title: 'Bangalore to Base Camp',
            activities: [
              { activityTime: '06:00', activityText: 'Departure from Bangalore' },
              { activityTime: '12:00', activityText: 'Lunch break at Chikmagalur' },
              { activityTime: '18:00', activityText: 'Reach base camp and check-in' }
            ]
          },
          {
            dayNumber: 2,
            title: 'Trek to Kudremukh Peak',
            activities: [
              { activityTime: '05:00', activityText: 'Wake up and breakfast' },
              { activityTime: '06:00', activityText: 'Start trek to peak' },
              { activityTime: '12:00', activityText: 'Reach summit and lunch' },
              { activityTime: '16:00', activityText: 'Descend to base camp' }
            ]
          },
          {
            dayNumber: 3,
            title: 'Return to Bangalore',
            activities: [
              { activityTime: '07:00', activityText: 'Breakfast and pack up' },
              { activityTime: '09:00', activityText: 'Depart for Bangalore' },
              { activityTime: '18:00', activityText: 'Reach Bangalore' }
            ]
          }
        ])
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trek Data');

    // Set column widths
    const wscols = [
      { wch: 12 }, // Batch Number
      { wch: 20 }, // Trek Name
      { wch: 15 }, // Location
      { wch: 12 }, // Difficulty
      { wch: 15 }, // Category
      { wch: 15 }, // Fitness Level
      { wch: 60 }, // Description
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 15 }, // Available Slots
      { wch: 10 }, // Price
      { wch: 10 }, // Min Age
      { wch: 10 }, // Max Age
      { wch: 18 }, // Duration
      { wch: 15 }, // Min Participants
      { wch: 15 }, // Max Participants
      { wch: 12 }, // Batch Status
      { wch: 60 }, // Highlights
      { wch: 70 }, // Inclusions
      { wch: 60 }, // Exclusions
      { wch: 70 }, // Things to Carry
      { wch: 70 }, // Important Notes
      { wch: 100 } // Itinerary
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, 'Trek_Multi_Batch_Template.xlsx');
  }

  /**
   * Download single batch template
   */
  downloadSingleBatchTemplate(): void {
    const templateData = [
    {
      // 🔹 BASIC TREK INFO
      'Trek Name': 'Kudremukh Trek',
      'Location': 'Western Ghats,Chikkamagaluru,Karnataka',
      'Difficulty': 'Moderate',
      'Category': 'Forest Trek',
      'Fitness Level': 'Intermediate',
      'Description': 'Kudremukh is known for its scenic views, wildlife, and rich biodiversity...',
      'Start Date': '2026-02-13',
      'End Date': '2026-02-15',
      'Available Slots': 25,
      'Price': 3500,
      'Min Age': 16,
      'Max Age': 60,
      'Duration': '3 Days / 2 Nights',
      'Min Participants': 10,
      'Max Participants': 25,
      'Batch Status': 'active',
      'Highlights': 'Rolling grasslands|Shola forests|Sunrise views|River crossings',
      'Inclusions': 'Accommodation|Meals|Trek Guide|Forest Permit|First Aid',
      'Exclusions': 'Transport|Personal Expenses|Insurance',
      'Things to Carry': 'Trekking Shoes|Rain Jacket|Torch|Water Bottle|Extra Clothes',
      'Important Notes': 'No alcohol|Follow guide instructions|Subject to weather conditions',
      'Itinerary': JSON.stringify([
        {
          dayNumber: 1,
          title: 'Arrival & Base Camp',
          activities: [
              { activityTime: '06:00', activityText: 'Departure from Bangalore' },
              { activityTime: '12:00', activityText: 'Lunch break at Chikmagalur' },
              { activityTime: '18:00', activityText: 'Reach base camp and check-in' }
            ]
        },
        {
          dayNumber: 2,
          title: 'Summit Trek',
          activities: [
              { activityTime: '05:00', activityText: 'Wake up and breakfast' },
              { activityTime: '06:00', activityText: 'Start trek to peak' },
              { activityTime: '12:00', activityText: 'Reach summit and lunch' },
              { activityTime: '16:00', activityText: 'Descend to base camp' }
            ]
        },
        {
          dayNumber: 3,
          title: 'Departure',
          activities: [
              { activityTime: '07:00', activityText: 'Breakfast and pack up' },
              { activityTime: '09:00', activityText: 'Depart for Bangalore' },
              { activityTime: '18:00', activityText: 'Reach Bangalore' }
            ]
        }
      ]),

      // 🔹 META / STATUS
      'Status': 'Active',
      'Created By': 'Admin',
      'Batch Type': 'Single'
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Single Batch');

    XLSX.writeFile(workbook, 'Trek_Single_Batch_Template.xlsx');
  }
}
