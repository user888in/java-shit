import { IsOptional, IsString, IsEmail, IsArray, IsInt, Min, IsUrl } from 'class-validator';

export class UpdateProspectDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  listingsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  averageSalePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearlyTransactionVolume?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialMediaProfiles?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recentListings?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recentSales?: string[];

  @IsOptional()
  techStack?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  painPoints?: string[];

  @IsOptional()
  intelligenceData?: Record<string, any>;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  canContact?: boolean;
}