import * as moment from "moment";
import { debug, logAppointment } from "../util/logging.util";

export interface IAppointment {
  id: number;
  start: string; // format YYYY-MM-DDTHH:mm:ss
  end: string; // format YYYY-MM-DDTHH:mm:ss
}

export interface IDatePickerSlot {
  id: number;
  startTime: string; // format HH:mm:ss
  endTime: string; // format HH:mm:ss
}

export interface IDatePickerItem {
  date: string; // format YYYY-MM-DD
  slots: IDatePickerSlot[];
}

export interface IDatePicker {
  items: IDatePickerItem[];
}

export class AppointmentService {
  public getAppointments(): IAppointment[] {
    debug("Appointments are loaded");
    const mockedAppointments = [
      {
        id: 1,
        start: "2020-02-02T07:30:00",
        end: "2020-02-02T11:30:00",
      },
      {
        id: 2,
        start: "2020-02-02T14:30:00",
        end: "2020-02-02T18:30:00",
      },
      {
        id: 3,
        start: "2020-02-03T08:00:00",
        end: "2020-02-03T16:00:00",
      },
      {
        id: 4,
        start: "2020-02-04T08:00:00",
        end: "2020-02-04T16:00:00",
      },
      {
        id: 5,
        start: "2020-02-04T08:00:00",
        end: "2020-02-04T12:00:00",
      },
    ];

    mockedAppointments.forEach((appointment) => logAppointment(appointment));

    return mockedAppointments;
  }

  private formatTimeToMoment(
    time: string,
    format: string = "HH:mm"
  ): moment.Moment {
    return moment(time, format);
  }

  private formatTime(
    time: moment.Moment | string,
    format: string = "HH:mm"
  ): string {
    return moment(time).format(format);
  }

  private createDatePickerSlot(
    id: number,
    startTime: string,
    endTime: string
  ): IDatePickerSlot {
    return { id, startTime, endTime };
  }

  private findOrCreateDatePickerItem(
    result: IDatePickerItem[],
    simpleDateString: string
  ): IDatePickerItem {
    const existingDate = result.find((res) => res.date === simpleDateString);

    if (existingDate) {
      return existingDate;
    } else {
      const newDate: IDatePickerItem = { date: simpleDateString, slots: [] };
      result.push(newDate);
      return newDate;
    }
  }

  private updateOverlappingSlot(
    overlappingSlot: IDatePickerSlot,
    item: IAppointment
  ): void {
    const start = this.formatTimeToMoment(overlappingSlot.startTime);
    const end = this.formatTimeToMoment(overlappingSlot.endTime);
    const min = moment.min(start, moment(item.start));
    const max = moment.max(end, moment(item.end));

    overlappingSlot.startTime = this.formatTime(min);
    overlappingSlot.endTime = this.formatTime(max);
  }

  checkOverlap(slotA: IDatePickerSlot, slotB: IDatePickerSlot): boolean {
    const startA = this.formatTimeToMoment(slotA.startTime);
    const endA = this.formatTimeToMoment(slotA.endTime);
    const startB = this.formatTimeToMoment(slotB.startTime);
    const endB = this.formatTimeToMoment(slotB.endTime);

    return startA.isBefore(endB) && endA.isAfter(startB);
  }

  convertToDatepicker(appointments: IAppointment[]): IDatePicker {
    const transformedDates: IDatePickerItem[] = appointments.reduce(
      (result: IDatePickerItem[], item: IAppointment) => {
        const startingDate = moment(item.start);
        const simpleDateString = this.formatTime(startingDate, "DD-MM-YYYY");

        const existingDate = this.findOrCreateDatePickerItem(
          result,
          simpleDateString
        );

        const overlappingSlot = existingDate.slots.find((slot) =>
          this.checkOverlap(
            slot,
            this.createDatePickerSlot(
              item.id,
              this.formatTime(startingDate),
              this.formatTime(item.end)
            )
          )
        );

        if (overlappingSlot) {
          this.updateOverlappingSlot(overlappingSlot, item);
        } else {
          existingDate.slots.push(
            this.createDatePickerSlot(
              item.id,
              this.formatTime(startingDate),
              this.formatTime(item.end)
            )
          );
        }

        return result;
      },
      []
    );

    return { items: transformedDates };
  }
}
