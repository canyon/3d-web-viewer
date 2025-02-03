# 3D Point Cloud and Geo-Json Visualization Web Application

This project is a lightweight, front-end web application built with **ReactJS** and **TailwindCSS**. It is designed to visualize **3D point cloud data** and integrate basic **GIS viewing functionality**. The user interface is inspired by the **VSCode** layout and offers a clean and user-friendly experience.

## Images

Below are screenshots of the application interface:

![File List Section](pics/image-1.png)

*Above: Geo-Json file visualization.*

![3D Visualization Area](pics/image-2.png)

*Above: 3D point cloud visualization.*

## Features

- **Left-side file list**: Users can drag and drop files for quick access and visualization.
- **Log information section**: Positioned at the bottom, the log section displays key actions, events, and data status updates.
- **3D display and operation area**: This section is located at the top and dynamically adjusts based on the selected file from the left-side list.
- **Responsive UI**: The user interface adapts automatically based on the file selected, displaying appropriate UI elements and functionality buttons.
- **Functionality buttons**: A vertically elongated button area is available to control various operations, and this area can be docked to the right side for more space-efficient use.
- **Expandable/collapsible sections**: The file list and log information areas can be expanded or collapsed, docking to their respective sides.
- **File list above 3D display**: The file list section opens horizontally above the 3D display area.

## Technology Stack

- **Frontend Framework**: ReactJS
- **Styling**: TailwindCSS
- **File Formats Supported**:
  - Point Cloud Data (PCD)
  - GIS Data (GeoJSON)
- **Additional Format Support**: The application will support future point cloud formats, including **TXT**, **LAS**, and **PLY**.

## User Interface

### 1. **Left-side File List**
- Users can drag and drop files into this area to easily load them for visualization.
- The file list should be easily scrollable and searchable, allowing users to quickly find the file they need.

### 2. **Log Information Section**
- Positioned at the bottom of the screen, this section provides real-time logs and information, such as loading statuses, errors, and actions performed.
- The section can be expanded or collapsed to give more space for the 3D display area.

### 3. **Main 3D Display Area**
- The top section of the screen will display the 3D point cloud data in an interactive viewer.
- As users select different files, this section will automatically update to show the corresponding visualization.
- The UI and functionality of this area will also adjust based on the selected file type (e.g., displaying buttons for rotating, zooming, or transforming the 3D model).

### 4. **Functionality Buttons Area**
- A vertical bar of buttons is displayed on the right side, offering functions such as:
  - Rotate/zoom the 3D point cloud.
  - Switch between different visualization modes.
  - Adjust data display settings.
- This area is collapsible and can be docked to the right side for efficient use of space.

### 5. **Expandable/Collapsible Sections**
- Users can toggle the left-side file list and the log information section to maximize the 3D display area or focus on file management and logs.

## How to Use

1. **Drag and Drop Files**: Drag and drop supported point cloud files (e.g., PCD, TXT, LAS, PLY) into the file list on the left side of the screen.
2. **Visualize the Data**: Once a file is selected, the 3D point cloud will automatically load and display in the main display area.
3. **Use Functional Buttons**: Utilize the vertical button area to control the visualization settings and interaction with the 3D data.
4. **View Logs**: Monitor real-time actions, errors, and status updates in the log information section at the bottom.

## Future Enhancements

- **Add Support for More Formats**: Expand support to include additional point cloud data formats.
- **Advanced GIS Features**: Integrate more advanced GIS functionalities such as map overlays and spatial analysis tools.
- **Interactive Tools**: Add more interactive tools for manipulating point cloud data, including filters, measurements, and annotations.

## Installation

To run the project locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
