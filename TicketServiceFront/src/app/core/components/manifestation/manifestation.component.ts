import { Component, OnInit } from '@angular/core';
import { Manifestation } from '../../model/Manifestation';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LocationDTO } from '../../model/LocationDTO';
import { ManifestationDays } from '../../model/ManifestationDays';
import { Address } from '../../model/Address';
import { ManifestationSectorPriceDto } from '../../model/ManifestationSectorPriceDto';
import { Sector } from '../../model/Sector';
import { BuyTicketDTO } from '../../model/BuyTicketDTO';
import { Ticket } from '../../model/Ticket';
import { SeatWithPriceDTO } from '../../model/SeatWithPriceDTO';
import { StorageService } from '../../services/storage/storage.service';
import { Reservation } from '../../model/Reservation';
import { DatePipe } from '@angular/common';
import { ManifestationInfo } from '../../model/ManifestationInfo';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { VerifySeatDto } from '../../model/VerifySeatDto';


@Component({
  selector: 'app-manifestation',
  templateUrl: './manifestation.component.html',
  styleUrls: ['./manifestation.component.scss'],
  providers: [DatePipe]
})
export class ManifestationComponent implements OnInit {

  manifestation: Manifestation = new Manifestation();
  id: number;
  private sub: any;
  location: LocationDTO = new LocationDTO();
  address: Address = new Address();
  manifestationPrices: ManifestationSectorPriceDto[] = [];
  buyTicketDTO: BuyTicketDTO = new BuyTicketDTO();
  manifestationInfo: ManifestationInfo = new ManifestationInfo();

  myRadio: string;
  selectedSector: Sector = new Sector();
  my_row: number;
  my_column: number;

  passed = true;

  verify = true;
  avilableSeats : VerifySeatDto;

  constructor(private http: HttpClient, private route: ActivatedRoute, private storageService: StorageService, 
    private datePipe: DatePipe, private router: Router, private authService: AuthService) { }

  ngOnInit() {

    this.avilableSeats = new VerifySeatDto();

    this.sub = this.route.params.subscribe(params => {
      this.id = + params['id'];
      this.http.get<Manifestation>('http://localhost:8080/api/manifestation/' + this.id).subscribe((data) => {
        this.manifestation = data;
        this.sortRadioBtnDays();
        
        this.http.get<LocationDTO>('http://localhost:8080/api/location/' + data.locationId).subscribe((data) => {
          this.location = data;
          this.address = data.address;
          this.sortSectorsList();
          
          this.http.get<ManifestationInfo>('http://localhost:8080/api/manifestation/manifestationInfo/' + this.id).subscribe((data) => {
            this.manifestationInfo = data;
          });
        });
      });
    });
  }

  public isPassed(){
    var manDate = new Date(this.manifestation.startTime);
    var now  = new Date();

    if(manDate < now){
      return this.passed = true;
    }
    else{
      return this.passed = false;
    }
  }

  public getSector(id: number) {
    let retVal;

    this.http.get<Sector>('http://localhost:8080/api/sector/' + id).subscribe((data) => {
      retVal = data;

      return retVal.sectorName;
    });
  }

  public buyTicket() {

    this.makeTicket();

    let headers = this.authService.getHeaders();
    console.log(this.buyTicketDTO);
    
    this.http.post<Ticket>('http://localhost:8080/api/ticket/buyTicket', this.buyTicketDTO, { headers: headers }).subscribe((data) => {
      alert("You have successfully bought ticket!");
      this.router.navigate(["/tickets"]);
     }, 
     (error) => {
       if(error.error.m != undefined){
        alert(error.error.m);
       }
     }
     );
  }

  public reserveTicket() {

    this.makeTicket();

    let headers = this.authService.getHeaders();

    this.http.put<Reservation>('http://localhost:8080/api/ticket/reserveTicket', this.buyTicketDTO, { headers: headers }).subscribe((data) => {
      alert("You have successfully made reservation!");
      this.router.navigate(["/reservations"]);
    } , 
    (error) => {
      if(error.error.m != undefined){
      alert(error.error.m);
      }
    } );

    

  }


  public makeTicket(){
    if (this.myRadio === undefined || this.myRadio === "") {
      alert("You must choose day!");
      return;
    }

    let dayId = +this.myRadio;
    this.buyTicketDTO.dayId = dayId;

    if (this.selectedSector.id == undefined) {
      alert("You must choose sector!");
      return;
    }

    let seatWithPrice = new SeatWithPriceDTO();
    seatWithPrice.manSectorId = this.selectedSector.id;
    seatWithPrice.row = this.my_row;
    seatWithPrice.seatNumber = this.my_column;

    this.buyTicketDTO.wantedSeat = seatWithPrice;
  }


  public getPrice(idManDay :number, idSector: number) {
    var i;
    for(i = 0 ; i < this.manifestationInfo.sectorPrices.length ; i++) {
      
      if(this.manifestationInfo.sectorPrices[i].manDayId == idManDay && this.manifestationInfo.sectorPrices[i].sectorId == idSector) {
        return this.manifestationInfo.sectorPrices[i].price;
      }
    }
  }

  public verifySeat(){

    if (this.myRadio === undefined || this.myRadio === "") {
      alert("You must choose day!");
      return;
    }

    let idManDay = +this.myRadio;

    if (this.selectedSector.id == undefined) {
      alert("You must choose sector!");
      return;
    }

    let idSector = this.selectedSector.id;

    console.log("idManDay, idSector", idManDay+" , "+idSector);
    
     this.http.get<VerifySeatDto>('http://localhost:8080/api/manifestation/verifySeat/' + idManDay +"/"+idSector).subscribe((data) => {
      this.avilableSeats = data;
      console.log(this.avilableSeats);
    }); 
  }

  public sortRadioBtnDays() {
    let i;
    let j;
    for(i = 0; i < this.manifestation.manDaysDto.length; i++){
      for(j = 0; j < this.manifestation.manDaysDto.length; j++){
        if(this.manifestation.manDaysDto[j].id > this.manifestation.manDaysDto[i].id){
            let temp = this.manifestation.manDaysDto[i];
            this.manifestation.manDaysDto[i] = this.manifestation.manDaysDto[j];
            this.manifestation.manDaysDto[j] = temp;
        }
      }
    }
  } 

  public sortSectorsList() {
    let i;
    let j;
    for(i = 0; i < this.location.sectors.length; i++){
      for(j = 0; j < this.location.sectors.length; j++){
        if(this.location.sectors[j].id > this.location.sectors[i].id){
            let temp = this.location.sectors[i];
            this.location.sectors[i] = this.location.sectors[j];
            this.location.sectors[j] = temp;
        }
      }
    }
  } 

}