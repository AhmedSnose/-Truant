import { Category, Priority, Truant, TruantWithRelations, Status as _Status } from "@/db/schema";

export type TruantResponse = Truant & {
  category: Category;
  priority: Priority;
  status: _Status;
};


export type FormData = {
    title: string;
    goalTime: string;
    totalTime: string;
    startDate: string;
    endDate: string;
    description: string;
    days?: Day[];
  };
  
  export interface Event {
    id?: string;
    title: string;
    start_time: string;
    end_time: string;
    // startDate: string;
    // endDate: string;
    description: string;
    weight:number;
    report:string;
    days?: Day[];
    truantId?:string
    statusId?:string
    status?:_Status,
    truant?:TruantWithRelations
  }

  export interface Status {
    value: string,
    color?: string,
    id?:string
  }
  
  export interface Day {
    id?: string;
    title: string;
    report: string | null;
    goalTime: number;
    totalTime: number;
    date: string | null;
    events?: Event[];
    status?:_Status,
    statusId?:string
  }
  
  export interface Sprint {
    id: string;
    title: string;
    totalTime: string | null;
    goalTime: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    days?: Day[];
  }

  