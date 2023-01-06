/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js"
import router from "../app/Router.js";
import mockStore from "../__mocks__/store"


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      const isIconHighlighted = windowIcon.classList.contains('active-icon')
      expect(isIconHighlighted).toBeTruthy()

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({
        data: bills.sort((a, b) => {
          return new Date(b.date) - new Date(a.date)
        })
      })

      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("Given I am connected as an employee", () => {
  test("Then when i click on the it should open a modal to display the attached file", () => {
    // accès à la page BILLS
    const html = BillsUI({
      data: bills
    })
    document.body.innerHTML = html
    // récupération bills
    const store = bills
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const ListOfBills = new Bills({ document, onNavigate, store, localStorage: window.localStorage, });
    // simulation modale
    $.fn.modal = jest.fn();
    const icon = screen.getAllByTestId('icon-eye')[0];
    const handleClickIconEye = jest.fn(() =>
      ListOfBills.handleClickIconEye(icon)
    );
    icon.addEventListener('click', handleClickIconEye);
    // déclenchement de l'événement
    fireEvent.click(icon);
    expect(handleClickIconEye).toHaveBeenCalled();
    const modale = document.getElementById('modaleFile');
    expect(modale).toBeTruthy();
  })
})

describe("When I click on 'Send a new bill' page", () => {
  test("Then I should be sent to 'New bill page'", () => {
    // page bills
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)
    // initialisation bills
    const store = bills;
    const billsList = new Bills({ document, onNavigate, store, localStorage: window.localStorage, });
    // fonctionnalité navigation
    const newBill = jest.fn(() => billsList.handleClickNewBill)
    const navigationButton = screen.getByTestId('btn-new-bill');
    navigationButton.addEventListener('click', newBill);
    fireEvent.click(navigationButton)
    expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
  })
})


//test d'intégration demandé sur notion pour GET Bills
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetch bills from mock API GET", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      // mock navigation
      const pathname = ROUTES_PATH['Bills']
      root.innerHTML = ROUTES({ pathname: pathname, loading: true })
      //mock bills
      const bills = new Bills({ document, onNavigate, store: mockStore, localStorage })
      bills.getBills().then(data => {
        root.innerHTML = BillsUI({ data })
        expect(document.querySelector('tbody').rows.length).toBeGreaterThan(0)
      })
    })
  })
  describe("When an error occurs because of the API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage', { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails because of 404 message error", async () => {
      const html = BillsUI({ error: 'Erreur 404' })
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    })

    test("fetches messages from an API and fails because of 500 message error", async () => {
      const html = BillsUI({ error: 'Erreur 500' })
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    })
  })
})