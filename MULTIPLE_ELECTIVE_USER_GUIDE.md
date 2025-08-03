# Multiple Elective Subjects - User Guide

## Overview
The routine system now supports creating elective classes with multiple subjects running simultaneously, with synchronized subject-teacher assignments. This matches real academic scenarios where students choose from multiple elective options during the same time slot.

## How to Create Multiple Elective Classes

### Step 1: Access the Routine Manager
1. Navigate to **Admin** → **Program Routine Manager**
2. Select your program (e.g., BCT), semester (7 or 8), and section
3. Click on an empty time slot where you want to schedule electives

### Step 2: Configure Basic Settings
1. **Class Type**: Select "Lecture (L)" 
2. **Elective Class**: Toggle **ON** ✅
3. **Elective Type**: Choose from:
   - TECHNICAL (for technical electives)
   - MANAGEMENT (for management electives) 
   - OPEN (for open electives)
4. **Elective Number**: 
   - For 7th semester: Always 1
   - For 8th semester: Choose 1 or 2 (Elective I or Elective II)

### Step 3: Add Multiple Subjects
The interface will show **"Add Elective Subjects"** section:

1. **Add First Subject**:
   - Use the dropdown to select your first elective subject
   - Example: "IOTBI302 - Internet of Things for Business Intelligence"

2. **Add More Subjects**:
   - The dropdown will refresh to show remaining subjects
   - Add subjects like: "ADMSCI - Advanced Management Science"
   - Continue adding: "EC303 - Electronic Commerce", etc.

3. **Remove Subjects**: Click the **×** button next to any subject to remove it

### Step 4: Assign Teachers
For each subject you added:

1. **Teacher Assignment**: Each subject gets its own teacher dropdown
2. **Synchronized Order**: The first subject gets the first teacher, second subject gets second teacher, etc.
3. **Teacher Selection**: Choose from available teachers (marked with green "Free" tags)

### Example Configuration:
```
Selected Subjects and Teachers (4)

📖 IOTBI302                    👨‍🏫 [Select: John Smith - JS] 
   Internet of Things...

📖 ADMSCI                      👨‍🏫 [Select: Mary Davis - MD]
   Advanced Management...

📖 EC303                       👨‍🏫 [Select: Peter Kumar - PK]
   Electronic Commerce

📖 ADSCI301                    👨‍🏫 [Select: Anna Brown - AB]
   Advanced Data Science
```

### Step 5: Complete Setup
1. **Room**: Select classroom (same room for all subjects)
2. **Target Sections**: Usually both AB and CD for cross-section electives
3. **Notes**: Add any additional information
4. **Save**: Click "Assign Class"

## What You'll See in the Routine

### Display Format:
```
┌─────────────────────────────────┐
│         Elective 1              │
│      (TECHNICAL)                │
│                                 │
│ IOTBI302 - JS                   │
│ ADMSCI   - MD                   │
│ EC303    - PK                   │ 
│ ADSCI301 - AB                   │
│                                 │
│ Cross-Section: AB, CD           │
│ Room: Lab-301                   │
└─────────────────────────────────┘
```

### Key Features:
- **Subject Codes**: Displayed prominently (IOTBI302, ADMSCI, EC303, etc.)
- **Teacher Codes**: Synchronized with subjects (JS, MD, PK, AB)
- **Order Maintained**: First subject-teacher pair appears first
- **Cross-Section Indicator**: Shows it applies to multiple sections

## Benefits of Multiple Electives

### ✅ **Academic Accuracy**
- Reflects real elective structure where students choose from multiple options
- Shows all available choices in one view

### ✅ **Teacher Management** 
- Prevents double-booking teachers across electives
- Clear assignment of teachers to specific subjects

### ✅ **Student Information**
- Students can see all elective options at a glance
- Easy identification of teacher for each subject choice

### ✅ **Administrative Efficiency**
- Create entire elective group in one operation
- Automatic validation prevents scheduling conflicts
- Consistent data across all sections

## Tips for Best Results

### 📝 **Subject Selection Order**
- Add subjects in the order you want them displayed
- Most popular subjects first, or alphabetical order
- Consider grouping by elective type

### 👥 **Teacher Assignment**
- Assign most experienced teachers to popular subjects
- Check teacher availability across sections
- Consider teacher expertise in subject areas

### 🏫 **Room Planning**
- Choose rooms with adequate capacity for cross-section classes
- Prefer rooms with good presentation facilities for electives
- Consider room location for student convenience

### 📋 **Naming Conventions**
- Use clear, consistent subject codes
- Ensure teacher short codes are unique and recognizable
- Add helpful notes for complex elective structures

## Troubleshooting

### ❌ **"Number of subjects must match number of teachers"**
- **Solution**: Assign a teacher to each subject you've added
- Each subject in the list must have a corresponding teacher selected

### ❌ **"Scheduling conflicts detected"**
- **Solution**: Check if any selected teachers are already assigned to other classes
- Look for room conflicts in the same time slot
- Verify no duplicate subjects are selected

### ❌ **"Subject is required"**
- **Solution**: Add at least one subject to the elective group
- Use the "Add Elective Subjects" dropdown to select subjects

### ❌ **Empty dropdown for subjects**
- **Solution**: Ensure subjects are marked as elective in the system
- Check that subjects exist for the selected semester
- Verify subject eligibility for the elective type

## Example: Complete 7th Semester Technical Elective Setup

```yaml
Configuration:
  Class Type: Lecture (L)
  Elective Class: ✅ Enabled
  Elective Type: TECHNICAL
  Elective Number: 1
  
Subjects & Teachers:
  1. IOTBI302 (IoT for BI) → John Smith (JS)
  2. ADMSCI (Adv Mgmt Sci) → Mary Davis (MD)  
  3. EC303 (E-Commerce) → Peter Kumar (PK)
  4. ADSCI301 (Adv Data Sci) → Anna Brown (AB)

Room: Lab-301
Target Sections: AB, CD
Notes: Technical Elective Group 1 - Students choose one subject

Result: All four elective options scheduled simultaneously with proper teacher assignments
```

This new system provides the flexibility and accuracy needed for modern academic elective scheduling! 🎓
