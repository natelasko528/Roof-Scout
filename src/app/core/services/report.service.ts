import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Lead, Session } from '../../shared/models/lead.model';

export interface LeadReportOptions {
  includeImages: boolean;
  includeWeather: boolean;
  includeMap: boolean;
}

export interface SessionReportOptions {
  includeLeads: boolean;
  includeStatistics: boolean;
  includeTerritory: boolean;
}

export interface TerritoryReportOptions {
  bounds?: { north: number; south: number; east: number; west: number };
  includeDensityMap: boolean;
  includeLeadSummary: boolean;
}

export interface PerformanceReportOptions {
  dateRange?: { start: Date; end: Date };
  includeTrends: boolean;
  includeCharts: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly pageWidth = 210; // A4 width in mm
  private readonly pageHeight = 297; // A4 height in mm
  private readonly margin = 15;

  constructor() {}

  /**
   * Generate a PDF report for a single lead
   */
  async generateLeadReport(
    lead: Lead,
    options: LeadReportOptions = {
      includeImages: true,
      includeWeather: false,
      includeMap: true,
    }
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.margin;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOF SCOUT LEAD REPORT', this.margin, yPosition);
    yPosition += 10;

    // Report metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated: ${reportDate}`, this.margin, yPosition);
    yPosition += 15;

    // Lead Details Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Lead Information', this.margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const leadDetails = [
      ['Address:', lead.address],
      ['Homeowner:', lead.homeownerName || 'N/A'],
      ['Phone:', lead.phone || 'N/A'],
      ['Email:', lead.email || 'N/A'],
      ['Status:', lead.status],
      ['Priority:', lead.priority],
      ['Created:', new Date(lead.createdAt).toLocaleDateString()],
    ];

    leadDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label || '', this.margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value || ''), this.margin + 50, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Roof Details Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Roof Details', this.margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const roofDetails = [
      ['Roof Age:', lead.roofAge ? `${lead.roofAge} years` : 'N/A'],
      ['Material:', lead.roofMaterial || 'N/A'],
      ['Visible Damage:', lead.visibleDamage ? 'Yes' : 'No'],
      [
        'Roof Score:',
        lead.roofScore !== null && lead.roofScore !== undefined
          ? `${lead.roofScore}/100`
          : 'Not scored',
      ],
    ];

    roofDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label || '', this.margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value || ''), this.margin + 50, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Roof Score Reasoning
    if (lead.roofScoreReasoning) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Analysis', this.margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const reasoningLines = doc.splitTextToSize(
        lead.roofScoreReasoning,
        this.pageWidth - 2 * this.margin
      );
      reasoningLines.forEach((line: string) => {
        if (yPosition > this.pageHeight - 30) {
          doc.addPage();
          yPosition = this.margin;
        }
        doc.text(line, this.margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Notes Section
    if (lead.notes) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', this.margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(
        lead.notes,
        this.pageWidth - 2 * this.margin
      );
      noteLines.forEach((line: string) => {
        if (yPosition > this.pageHeight - 30) {
          doc.addPage();
          yPosition = this.margin;
        }
        doc.text(line, this.margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Images Section
    if (options.includeImages && (lead.imageUrl || (lead.userImageUrls && lead.userImageUrls.length > 0))) {
      doc.addPage();
      yPosition = this.margin;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Property Images', this.margin, yPosition);
      yPosition += 10;

      // Satellite image
      if (lead.imageUrl) {
        try {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Satellite View', this.margin, yPosition);
          yPosition += 5;

          const imgWidth = this.pageWidth - 2 * this.margin;
          const imgHeight = 60;
          await this.addImageToPDF(doc, lead.imageUrl, this.margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error('Error adding satellite image:', error);
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text('Failed to load satellite image', this.margin, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 10;
        }
      }

      // User images
      if (lead.userImageUrls && lead.userImageUrls.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('User Uploaded Photos', this.margin, yPosition);
        yPosition += 5;

        for (let i = 0; i < lead.userImageUrls.length; i++) {
          if (yPosition > this.pageHeight - 80) {
            doc.addPage();
            yPosition = this.margin;
          }

          try {
            const imgWidth = this.pageWidth - 2 * this.margin;
            const imgHeight = 60;
            const imageUrl = lead.userImageUrls?.[i];
            if (imageUrl) {
              await this.addImageToPDF(doc, imageUrl, this.margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 10;
            }
          } catch (error) {
            console.error(`Error adding user image ${i}:`, error);
            doc.setFontSize(10);
            doc.setTextColor(255, 0, 0);
            doc.text(`Failed to load image ${i + 1}`, this.margin, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 10;
          }
        }
      }
    }

    // Save the PDF
    const fileName = `lead_report_${lead.address.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  /**
   * Generate a PDF report for a session
   */
  async generateSessionReport(
    session: Session,
    options: SessionReportOptions = {
      includeLeads: true,
      includeStatistics: true,
      includeTerritory: false,
    }
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.margin;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOF SCOUT SESSION REPORT', this.margin, yPosition);
    yPosition += 10;

    // Session metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated: ${reportDate}`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Session: ${session.name}`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Created: ${new Date(session.createdAt).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Total Leads: ${session.leads.length}`, this.margin, yPosition);
    yPosition += 15;

    // Statistics Section
    if (options.includeStatistics) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Session Statistics', this.margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const stats = this.calculateSessionStatistics(session.leads);
      const statusCounts = this.countByStatus(session.leads);
      const priorityCounts = this.countByPriority(session.leads);

      // Status breakdown
      doc.setFont('helvetica', 'bold');
      doc.text('Status Breakdown:', this.margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`• ${status}: ${count}`, this.margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 3;

      // Priority breakdown
      doc.setFont('helvetica', 'bold');
      doc.text('Priority Breakdown:', this.margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        doc.text(`• ${priority}: ${count}`, this.margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 3;

      // Overall statistics
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Metrics:', this.margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`• Average Roof Score: ${stats.averageRoofScore.toFixed(1)}`, this.margin + 5, yPosition);
      yPosition += 5;
      doc.text(`• Leads with Visible Damage: ${stats.leadsWithDamage}`, this.margin + 5, yPosition);
      yPosition += 5;
      doc.text(`• High Priority Leads: ${priorityCounts['High'] || 0}`, this.margin + 5, yPosition);
      yPosition += 10;
    }

    // Leads Table
    if (options.includeLeads && session.leads.length > 0) {
      if (yPosition > this.pageHeight - 60) {
        doc.addPage();
        yPosition = this.margin;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Leads Summary', this.margin, yPosition);
      yPosition += 10;

      // Table headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Address', this.margin, yPosition);
      doc.text('Homeowner', this.margin + 60, yPosition);
      doc.text('Status', this.margin + 110, yPosition);
      doc.text('Priority', this.margin + 150, yPosition);
      doc.text('Score', this.margin + 180, yPosition);
      yPosition += 5;

      // Draw line under headers
      doc.line(this.margin, yPosition, this.pageWidth - this.margin, yPosition);
      yPosition += 3;

      // Table rows
      doc.setFont('helvetica', 'normal');
      session.leads.forEach((lead) => {
        if (yPosition > this.pageHeight - 20) {
          doc.addPage();
          yPosition = this.margin;

          // Redraw headers
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Address', this.margin, yPosition);
          doc.text('Homeowner', this.margin + 60, yPosition);
          doc.text('Status', this.margin + 110, yPosition);
          doc.text('Priority', this.margin + 150, yPosition);
          doc.text('Score', this.margin + 180, yPosition);
          yPosition += 8;
        }

        const address = this.truncateText(lead.address, 30);
        const homeowner = this.truncateText(lead.homeownerName || 'N/A', 20);
        const score = lead.roofScore !== null && lead.roofScore !== undefined ? lead.roofScore.toString() : 'N/A';

        doc.text(address, this.margin, yPosition);
        doc.text(homeowner, this.margin + 60, yPosition);
        doc.text(lead.status, this.margin + 110, yPosition);
        doc.text(lead.priority, this.margin + 150, yPosition);
        doc.text(score, this.margin + 180, yPosition);
        yPosition += 5;
      });
    }

    // Save the PDF
    const fileName = `session_report_${session.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  /**
   * Generate a territory report
   */
  async generateTerritoryReport(
    leads: Lead[],
    options: TerritoryReportOptions = {
      includeDensityMap: true,
      includeLeadSummary: true,
    }
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.margin;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOF SCOUT TERRITORY REPORT', this.margin, yPosition);
    yPosition += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated: ${reportDate}`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Total Leads: ${leads.length}`, this.margin, yPosition);
    yPosition += 15;

    // Territory Summary
    if (options.includeLeadSummary) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Territory Overview', this.margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const stats = this.calculateSessionStatistics(leads);
      const statusCounts = this.countByStatus(leads);

      doc.text(`Total Properties: ${leads.length}`, this.margin, yPosition);
      yPosition += 6;

      const avgScore = stats.averageRoofScore.toFixed(1);
      doc.text(`Average Roof Score: ${avgScore}`, this.margin, yPosition);
      yPosition += 6;

      const uniqueAddresses = new Set(leads.map(l => l.address)).size;
      doc.text(`Unique Addresses: ${uniqueAddresses}`, this.margin, yPosition);
      yPosition += 6;

      const propertiesWithHighScores = leads.filter(l => (l.roofScore || 0) >= 70).length;
      doc.text(`High-Potential Properties (Score ≥70): ${propertiesWithHighScores}`, this.margin, yPosition);
      yPosition += 10;

      // Status breakdown
      doc.setFont('helvetica', 'bold');
      doc.text('Status Distribution:', this.margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = ((count / leads.length) * 100).toFixed(1);
        doc.text(`• ${status}: ${count} (${percentage}%)`, this.margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // High-priority leads
    const highPriorityLeads = leads.filter(l => l.priority === 'High');
    if (highPriorityLeads.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('High Priority Leads', this.margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      highPriorityLeads.forEach((lead) => {
        if (yPosition > this.pageHeight - 30) {
          doc.addPage();
          yPosition = this.margin;
        }

        const score = lead.roofScore !== null && lead.roofScore !== undefined ? lead.roofScore.toString() : 'N/A';
        doc.text(`• ${lead.address}`, this.margin, yPosition);
        yPosition += 5;
        doc.text(`  Homeowner: ${lead.homeownerName || 'N/A'} | Status: ${lead.status} | Score: ${score}`, this.margin + 5, yPosition);
        yPosition += 6;
      });
    }

    // Save the PDF
    const fileName = `territory_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  /**
   * Generate a performance report
   */
  async generatePerformanceReport(
    sessions: Session[],
    options: PerformanceReportOptions = {
      includeTrends: true,
      includeCharts: false,
    }
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.margin;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOF SCOUT PERFORMANCE REPORT', this.margin, yPosition);
    yPosition += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated: ${reportDate}`, this.margin, yPosition);
    yPosition += 6;

    const allLeads = sessions.flatMap(s => s.leads);
    doc.text(`Total Sessions: ${sessions.length}`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Total Leads: ${allLeads.length}`, this.margin, yPosition);
    yPosition += 15;

    // Overall Performance Metrics
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Metrics', this.margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const stats = this.calculateSessionStatistics(allLeads);
    const statusCounts = this.countByStatus(allLeads);

    // Calculate conversion rates
    const totalVisited = allLeads.filter(l => l.status !== 'Not Visited').length;
    const interested = allLeads.filter(l => l.status === 'Interested').length;
    const appointments = allLeads.filter(l => l.status === 'Appointment').length;
    const completed = allLeads.filter(l => l.status === 'Completed').length;

    doc.text(`Total Leads Visited: ${totalVisited}`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Interest Rate: ${totalVisited > 0 ? ((interested / totalVisited) * 100).toFixed(1) : 0}% (${interested}/${totalVisited})`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Appointment Rate: ${totalVisited > 0 ? ((appointments / totalVisited) * 100).toFixed(1) : 0}% (${appointments}/${totalVisited})`, this.margin, yPosition);
    yPosition += 6;
    doc.text(`Completion Rate: ${totalVisited > 0 ? ((completed / totalVisited) * 100).toFixed(1) : 0}% (${completed}/${totalVisited})`, this.margin, yPosition);
    yPosition += 10;

    // Session Breakdown
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Breakdown', this.margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    sessions.forEach((session) => {
      if (yPosition > this.pageHeight - 40) {
        doc.addPage();
        yPosition = this.margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(session.name, this.margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');

      const sessionStats = this.calculateSessionStatistics(session.leads);
      doc.text(`  Leads: ${session.leads.length} | Avg Score: ${sessionStats.averageRoofScore.toFixed(1)} | High Priority: ${session.leads.filter(l => l.priority === 'High').length}`, this.margin + 5, yPosition);
      yPosition += 8;
    });

    // Save the PDF
    const fileName = `performance_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Private helper methods

  private async addImageToPDF(
    doc: jsPDF,
    imageUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width * 4; // Higher resolution
          canvas.height = height * 4;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Could not get canvas context');
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          doc.addImage(dataURL, 'JPEG', x, y, width, height);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  private calculateSessionStatistics(leads: Lead[]) {
    const scoredLeads = leads.filter(l => l.roofScore !== null && l.roofScore !== undefined);
    const averageRoofScore = scoredLeads.length > 0
      ? scoredLeads.reduce((sum, l) => sum + (l.roofScore || 0), 0) / scoredLeads.length
      : 0;

    const leadsWithDamage = leads.filter(l => l.visibleDamage).length;

    return {
      averageRoofScore,
      leadsWithDamage,
    };
  }

  private countByStatus(leads: Lead[]): Record<string, number> {
    return leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private countByPriority(leads: Lead[]): Record<string, number> {
    return leads.reduce((acc, lead) => {
      acc[lead.priority] = (acc[lead.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
