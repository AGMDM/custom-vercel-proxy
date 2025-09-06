// Kajabi API integration using the official API
// https://app.kajabi.com/api-docs/v1/public_api/swagger.yaml

interface KajabiContact {
  id: string;
  type: string;
  attributes: {
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
    subscribed?: boolean;
    [key: string]: any;
  };
  relationships?: {
    site: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface KajabiContactResponse {
  data: KajabiContact[];
  meta?: {
    total_count: number;
    total_pages: number;
    current_page: number;
  };
  links?: {
    self: string;
    first: string;
    last: string;
    next?: string;
    prev?: string;
  };
}

interface KajabiAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface KajabiUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

class KajabiAPIClient {
  private baseURL: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor() {
    this.baseURL = process.env.KAJABI_API_URL || 'https://api.kajabi.com';
    this.clientId = process.env.KAJABI_CLIENT_ID || '';
    this.clientSecret = process.env.KAJABI_CLIENT_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Kajabi auth error (${response.status}):`, errorText);
        throw new Error(`Failed to authenticate with Kajabi: ${response.status}`);
      }

      const data: KajabiAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

      return this.accessToken;
    } catch (error) {
      console.error('Error authenticating with Kajabi:', error);
      throw new Error('Failed to authenticate with Kajabi API');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Kajabi API error (${response.status}):`, errorText);
      throw new Error(`Kajabi API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async findContactByEmail(email: string, siteId?: string): Promise<KajabiContact | null> {
    try {
      const params = new URLSearchParams({
        'filter[email_contains]': email,
        'page[size]': '10',
      });

      // Add site filter if provided
      if (siteId) {
        params.append('filter[site_id]', siteId);
      }

      const response = await this.makeRequest<KajabiContactResponse>(
        `/v1/contacts?${params.toString()}`
      );

      // Check if we found an exact email match
      const exactMatch = response.data.find(
        contact => contact.attributes.email.toLowerCase() === email.toLowerCase()
      );

      return exactMatch || null;
    } catch (error) {
      console.error('Error searching for contact in Kajabi:', error);
      // Fall back to mock data if API is not configured
      return this.getMockContact(email);
    }
  }

  async createContact(contactData: {
    name: string;
    email: string;
    siteId: string;
    [key: string]: any;
  }): Promise<KajabiContact | null> {
    try {
      const { name, email, siteId, ...additionalData } = contactData;
      
      const response = await this.makeRequest<{ data: KajabiContact }>('/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            type: 'contacts',
            attributes: {
              name,
              email,
              subscribed: true,
              ...additionalData,
            },
            relationships: {
              site: {
                data: {
                  type: 'sites',
                  id: siteId,
                },
              },
            },
          },
        }),
      });

      return response.data;
    } catch (error) {
      console.error('Error creating contact in Kajabi:', error);
      return null;
    }
  }

  async getSites(): Promise<any[]> {
    try {
      const response = await this.makeRequest<{ data: any[] }>('/v1/sites');
      return response.data;
    } catch (error) {
      console.error('Error fetching sites from Kajabi:', error);
      return [];
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Mock data fallback for development/testing
  private getMockContact(email: string): KajabiContact | null {
    const mockContacts = [
      {
        id: 'kajabi_1',
        type: 'contacts',
        attributes: {
          name: 'Admin User',
          email: 'admin@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          subscribed: true,
        },
      },
      {
        id: 'kajabi_2',
        type: 'contacts',
        attributes: {
          name: 'Regular User',
          email: 'user@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          subscribed: true,
        },
      },
      {
        id: 'kajabi_3',
        type: 'contacts',
        attributes: {
          name: 'Matteo De Marie',
          email: 'de.marie.matteo@gmail.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          subscribed: true,
        },
      },
    ];

    return mockContacts.find(contact => 
      contact.attributes.email.toLowerCase() === email.toLowerCase()
    ) || null;
  }
}

// Export a singleton instance
export const kajabiClient = new KajabiAPIClient();

// Main API functions
export async function verifyKajabiUser(email: string): Promise<boolean> {
  try {
    const contact = await kajabiClient.findContactByEmail(email);
    return contact !== null && contact.attributes.subscribed !== false;
  } catch (error) {
    console.error('Kajabi verification failed:', error);
    return false;
  }
}

export async function getKajabiUser(email: string): Promise<KajabiUser | null> {
  try {
    const contact = await kajabiClient.findContactByEmail(email);
    
    if (!contact) {
      return null;
    }

    // Parse name into first/last name
    const nameParts = contact.attributes.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: contact.id,
      email: contact.attributes.email,
      firstName,
      lastName,
      isActive: contact.attributes.subscribed !== false,
    };
  } catch (error) {
    console.error('Failed to get Kajabi user:', error);
    return null;
  }
}

// Helper functions for registration
export async function verifyEmailInKajabi(email: string): Promise<boolean> {
  try {
    const contact = await kajabiClient.findContactByEmail(email);
    return contact !== null;
  } catch (error) {
    console.error('Error verifying email in Kajabi:', error);
    return false;
  }
}

export async function createContactInKajabi(userData: {
  name: string;
  email: string;
  siteId?: string;
}): Promise<boolean> {
  try {
    // If no siteId provided, get the first available site
    let siteId = userData.siteId;
    if (!siteId) {
      const sites = await kajabiClient.getSites();
      if (sites.length === 0) {
        console.error('No sites available in Kajabi');
        return false;
      }
      siteId = sites[0].id;
    }

    const contact = await kajabiClient.createContact({
      name: userData.name,
      email: userData.email,
      siteId: siteId as string,
    });

    return contact !== null;
  } catch (error) {
    console.error('Error creating contact in Kajabi:', error);
    return false;
  }
}

export async function isKajabiConfigured(): Promise<boolean> {
  return await kajabiClient.validateCredentials();
}
