const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
      throw new Error('Email configuration missing');
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        debug: true, // Enable debug logs
        logger: true  // Enable logger
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service verification failed:', error);
        } else {
          console.log('Email service is ready to send messages');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw new Error('Email service initialization failed');
    }
  }

  formatActivities(activities) {
    return activities.map(activity => `
      <div style="margin-bottom: 10px;">
        <strong>${activity.title}</strong><br>
        Time: ${activity.startTime} - ${activity.endTime}<br>
        Location: ${activity.location.name}<br>
        ${activity.description ? `Description: ${activity.description}<br>` : ''}
        ${activity.cost?.amount ? `Cost: ${activity.cost.amount} ${activity.cost.currency}` : ''}
      </div>
    `).join('');
  }

  formatDayPlan(dayPlan, index) {
    const date = new Date(dayPlan.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div style="margin-bottom: 20px;">
        <h3>Day ${index + 1} - ${date}</h3>
        ${this.formatActivities(dayPlan.activities)}
      </div>
    `;
  }

  async sendShareItineraryEmail(toEmail, fromUser, itinerary) {
    if (!toEmail || !fromUser || !itinerary) {
      throw new Error('Missing required parameters for sending email');
    }

    console.log('Preparing to send itinerary email to:', toEmail);
    console.log('From user:', fromUser.firstName, fromUser.lastName);
    console.log('Itinerary destination:', itinerary.destination.city);

    const mailOptions = {
      from: {
        name: 'WanderWise',
        address: process.env.EMAIL_USER
      },
      to: toEmail,
      subject: `${fromUser.firstName} shared a travel itinerary with you: ${itinerary.destination.city} Trip`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(120deg, #2E7D32, #4CAF50); padding: 32px 24px; text-align: center;">
            <img src="https://wanderwise.travel/images/logo-white.png" alt="WanderWise" style="height: 40px; margin-bottom: 16px;" />
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Travel Itinerary Shared</h1>
          </div>
          
          <!-- Main content -->
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              ${fromUser.firstName} ${fromUser.lastName} has shared a travel itinerary with you.
            </p>
            
            <!-- Itinerary Overview Card -->
            <div style="background-color: #F8F9FA; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h2 style="color: #2E7D32; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Itinerary Overview</h2>
              <p style="margin: 8px 0;"><strong>Destination:</strong> ${itinerary.destination.city}, ${itinerary.destination.country}</p>
              <p style="margin: 8px 0;"><strong>Dates:</strong> ${new Date(itinerary.startDate).toLocaleDateString()} - ${new Date(itinerary.endDate).toLocaleDateString()}</p>
              <p style="margin: 8px 0;"><strong>Travel Style:</strong> ${itinerary.travelStyle}</p>
              <p style="margin: 8px 0;"><strong>Budget:</strong> ${itinerary.budget.planned} ${itinerary.budget.currency}</p>
            </div>

            <!-- Daily Schedule -->
            <div style="margin-top: 32px;">
              <h2 style="color: #2E7D32; font-size: 20px; font-weight: 600;">Daily Schedule</h2>
              ${itinerary.dayPlans.map((day, index) => this.formatDayPlan(day, index)).join('')}
            </div>

            ${itinerary.preferences ? `
              <!-- Preferences Card -->
              <div style="background-color: #F8F9FA; padding: 24px; border-radius: 12px; margin: 24px 0;">
                <h2 style="color: #2E7D32; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Travel Preferences</h2>
                ${itinerary.preferences.interests?.length ? `
                  <p style="margin: 8px 0;"><strong>Interests:</strong> ${itinerary.preferences.interests.join(', ')}</p>
                ` : ''}
                ${itinerary.preferences.dietaryRestrictions?.length ? `
                  <p style="margin: 8px 0;"><strong>Dietary Restrictions:</strong> ${itinerary.preferences.dietaryRestrictions.join(', ')}</p>
                ` : ''}
              </div>
            ` : ''}

            <!-- Footer Message -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px; line-height: 1.5;">
                This itinerary was shared via WanderWise. Create an account to start planning your own adventures!
              </p>
              <a href="https://wanderwise.travel/signup" style="display: inline-block; background-color: #2E7D32; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; margin-top: 16px;">
                Join WanderWise
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #F8F9FA; padding: 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Made with ❤️ by WanderWise<br>
              Your AI-powered travel companion
            </p>
          </div>
        </div>
      `,
      // Add text version for email clients that don't support HTML
      text: `
        WanderWise - Your AI Travel Companion

        ${fromUser.firstName} ${fromUser.lastName} has shared a travel itinerary with you.
        
        ITINERARY OVERVIEW
        Destination: ${itinerary.destination.city}, ${itinerary.destination.country}
        Dates: ${new Date(itinerary.startDate).toLocaleDateString()} - ${new Date(itinerary.endDate).toLocaleDateString()}
        Travel Style: ${itinerary.travelStyle}
        Budget: ${itinerary.budget.planned} ${itinerary.budget.currency}
        
        Please view this email in an HTML-capable email client to see the full itinerary details.
        
        Join WanderWise: https://wanderwise.travel/signup
      `
    };

    try {
      console.log('Attempting to send email...');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command
      });
      throw new Error(`Failed to send share notification email: ${error.message}`);
    }
  }

  async sendFlightDetails(toEmail, flight) {
    if (!toEmail || !flight) {
      throw new Error('Missing required parameters for sending email');
    }

    console.log('Preparing to send flight details to:', toEmail);

    const firstSegment = flight.itineraries[0].segments[0];
    const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];

    const formatSegment = (segment) => `
      <tr>
        <td style="padding: 10px;">
          <strong>${segment.departure.iataCode}</strong><br>
          ${new Date(segment.departure.time).toLocaleString()}<br>
          ${segment.departure.terminal ? `Terminal ${segment.departure.terminal}` : ''}
        </td>
        <td style="padding: 10px; text-align: center;">→</td>
        <td style="padding: 10px;">
          <strong>${segment.arrival.iataCode}</strong><br>
          ${new Date(segment.arrival.time).toLocaleString()}<br>
          ${segment.arrival.terminal ? `Terminal ${segment.arrival.terminal}` : ''}
        </td>
      </tr>
      <tr>
        <td colspan="3" style="padding: 10px;">
          Flight: ${segment.carrierCode} ${segment.flightNumber}<br>
          Duration: ${segment.duration}
        </td>
      </tr>
    `;

    const mailOptions = {
      from: {
        name: 'WanderWise',
        address: process.env.EMAIL_USER
      },
      to: toEmail,
      subject: `Flight Details: ${firstSegment.departure.iataCode} to ${lastSegment.arrival.iataCode}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header with gradient background -->
          <div style="background: linear-gradient(120deg, #2E7D32, #4CAF50); padding: 32px 24px; text-align: center; color: white;">
            <img src="https://wanderwise.travel/images/logo-white.png" alt="WanderWise" style="height: 40px; margin-bottom: 16px;" />
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Flight Details</h1>
          </div>
          
          <!-- Main content -->
          <div style="padding: 32px 24px;">
            <div style="background-color: #F8F9FA; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h2 style="color: #2E7D32; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Flight Summary</h2>
              <p style="margin: 8px 0;">
                <strong>Price:</strong> ${flight.price.amount} ${flight.price.currency}
              </p>
              <p style="margin: 8px 0;">
                <strong>Class:</strong> ${flight.travelClass}
              </p>
            </div>

            <h3 style="color: #2E7D32; font-size: 18px; margin-bottom: 16px;">Flight Schedule</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #F8F9FA; border-radius: 12px;">
              ${flight.itineraries.map((itinerary, index) => `
                ${index > 0 ? '<tr><td colspan="3" style="text-align: center; padding: 10px;"><strong>Return Flight</strong></td></tr>' : ''}
                ${itinerary.segments.map(formatSegment).join('')}
              `).join('')}
            </table>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px; line-height: 1.5;">
                This flight information was shared via WanderWise. Create an account to start planning your own trips!
              </p>
              <a href="https://wanderwise.travel/signup" style="display: inline-block; background-color: #2E7D32; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
                Join WanderWise
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #F8F9FA; padding: 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Made with ❤️ by WanderWise<br>
              Your AI-powered travel companion
            </p>
          </div>
        </div>
      `,
      text: `
        Flight Details: ${firstSegment.departure.iataCode} to ${lastSegment.arrival.iataCode}

        Price: ${flight.price.amount} ${flight.price.currency}
        Class: ${flight.travelClass}

        ${flight.itineraries.map((itinerary, index) => `
          ${index > 0 ? '\nReturn Flight:' : 'Outbound Flight:'}
          ${itinerary.segments.map(segment => `
            ${segment.departure.iataCode} → ${segment.arrival.iataCode}
            Departure: ${new Date(segment.departure.time).toLocaleString()}
            Arrival: ${new Date(segment.arrival.time).toLocaleString()}
            Flight: ${segment.carrierCode} ${segment.flightNumber}
            Duration: ${segment.duration}
          `).join('\n')}
        `).join('\n')}

        Book your flights and plan your trips with WanderWise: https://wanderwise.travel
      `
    };

    try {
      console.log('Attempting to send flight details email...');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command
      });
      throw new Error(`Failed to send flight details email: ${error.message}`);
    }
  }
}

module.exports = new EmailService(); 